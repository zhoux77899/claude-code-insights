import json
import unittest
from unittest.mock import Mock, patch

import requests

from scripts.github_api import GitHubAPIError, GitHubClient, GitHubRateLimitError


def response(status, body, **headers):
    result = requests.Response()
    result.status_code = status
    result.headers.update(headers)
    result._content = json.dumps(body).encode()
    return result


def search_page(total=1, name="owner/plugin"):
    return {
        "total_count": total,
        "incomplete_results": False,
        "items": [{"repository": {"full_name": name, "private": False}}],
    }


def public_node(reported_id="R_new"):
    return {
        "id": reported_id,
        "nameWithOwner": "owner/plugin",
        "visibility": "PUBLIC",
        "url": "https://github.com/owner/plugin",
        "defaultBranchRef": {"name": "main"},
        "pushedAt": "2026-11-12T00:00:00Z",
        "stargazerCount": 34,
        "forks": {"totalCount": 8},
        "watchers": {"totalCount": 5},
    }


class GitHubClientTests(unittest.TestCase):
    def setUp(self):
        self.session = Mock(spec=requests.Session())
        self.session.headers = {}
        self.client = GitHubClient("ghs_example_not_real", self.session)

    def test_discovery_uses_first_real_page_and_caps_requests(self):
        self.session.request.side_effect = [
            response(200, search_page(total=58_176, name=f"owner/plugin-{page}"))
            for page in range(1, 11)
        ]

        names, capped = self.client.discover()

        self.assertTrue(capped)
        self.assertEqual(len(names), 10)
        params = [call.kwargs["params"] for call in self.session.request.call_args_list]
        self.assertEqual([page["page"] for page in params], list(range(1, 11)))
        self.assertTrue(all(page["per_page"] == 100 and "sort" not in page for page in params))

    def test_discovery_rejects_malformed_and_incomplete_pages(self):
        malformed_pages = [
            {"total_count": 1, "incomplete_results": False},
            {"total_count": 1, "incomplete_results": True, "items": []},
        ]
        for page in malformed_pages:
            with self.subTest(page=page):
                self.session.request.reset_mock()
                self.session.request.side_effect = [response(200, search_page(total=101)), response(200, page)]
                with self.assertRaisesRegex(GitHubAPIError, r"page 2"):
                    self.client.discover()
                self.assertEqual(self.session.request.call_count, 2)

    def test_discovery_excludes_private_results(self):
        payload = search_page(total=2)
        payload["items"].append({"repository": {"full_name": "owner/private-project", "private": True}})
        self.session.request.return_value = response(200, payload)

        self.assertEqual(self.client.discover(), ({"owner/plugin"}, False))

    def test_permission_and_validation_errors_do_not_retry_or_expose_tokens(self):
        for status in (401, 403, 422):
            with self.subTest(status=status), self.assertLogs("scripts.github_api", level="WARNING") as logs:
                self.session.request.reset_mock()
                self.session.request.return_value = response(
                    status, {"message": "Cannot use ghs_example_not_real or github_pat_fixture"},
                    **{"x-ratelimit-remaining": "7", "x-github-request-id": "ID:123"},
                )
                with self.assertRaisesRegex(GitHubAPIError, f"HTTP {status}"):
                    self.client.discover()
                self.session.request.assert_called_once()
                self.assertIn("request_id=ID:123", logs.output[0])
                self.assertIn("<redacted>", logs.output[0])
                self.assertNotIn("example_not_real", logs.output[0])
                self.assertNotIn("github_pat_fixture", logs.output[0])

    @patch("scripts.github_api.time.sleep")
    def test_retry_after_then_transient_server_failure(self, sleep):
        self.session.request.side_effect = [
            response(429, {"message": "secondary rate limit"}, **{"retry-after": "4"}),
            response(503, {"message": "Unavailable"}),
            response(200, search_page()),
        ]

        self.assertEqual(self.client.discover(), ({"owner/plugin"}, False))
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [4, 2])

    @patch("scripts.github_api.time.sleep")
    def test_timeouts_stop_at_attempt_limit(self, sleep):
        self.session.request.side_effect = requests.Timeout()

        with self.assertRaisesRegex(GitHubAPIError, "Timeout"):
            self.client.discover()

        self.assertEqual(self.session.request.call_count, 3)
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [1, 2])

    @patch("scripts.github_api.time.time", return_value=1000)
    @patch("scripts.github_api.time.sleep")
    def test_primary_limit_past_deadline_stops_without_sleep(self, sleep, _):
        self.session.request.return_value = response(403, {"message": "API rate limit exceeded"}, **{
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "2500",
        })

        with self.assertRaises(GitHubRateLimitError):
            self.client.discover()

        self.session.request.assert_called_once()
        sleep.assert_not_called()

    @patch("scripts.github_api.time.time", return_value=1000)
    @patch("scripts.github_api.time.sleep")
    def test_graphql_paces_the_next_batch_from_remaining_quota(self, sleep, _):
        first_batch = [public_node(f"R_{index}") for index in range(50)]
        self.session.request.side_effect = [
            response(200, {"data": {"nodes": first_batch}}, **{
                "x-ratelimit-remaining": "0",
                "x-ratelimit-reset": "1004",
            }),
            response(200, {"data": {"nodes": [public_node()]}}),
        ]

        requested_ids = [f"id-{index}" for index in range(51)]
        self.assertEqual(len(self.client.refresh(requested_ids)), 51)

        batches = [call.kwargs["json"]["variables"]["ids"] for call in self.session.request.call_args_list]
        self.assertEqual(batches, [requested_ids[:50], requested_ids[50:]])
        sleep.assert_called_once_with(5)

    def test_graphql_preserves_good_nodes_and_explicitly_marks_private(self):
        self.session.request.return_value = response(200, {
            "data": {"nodes": [public_node(), None, {"id": "private", "visibility": "PRIVATE"}]},
            "errors": [{"type": "NOT_FOUND", "path": ["nodes", 1], "message": "Missing"}],
        })

        records = self.client.refresh(["legacy-id", "missing", "private"])

        self.assertIn("forks(first: 1) { totalCount }", self.session.request.call_args.kwargs["json"]["query"])
        self.assertNotIn("missing", records)
        self.assertEqual(records["private"], {"private": True})
        self.assertEqual(records["legacy-id"], {
            "node_id": "R_new",
            "full_name": "owner/plugin",
            "name": "plugin",
            "private": False,
            "stargazers_count": 34,
            "watchers_count": 34,
            "forks_count": 8,
            "subscribers_count": 5,
            "default_branch": "main",
            "html_url": "https://github.com/owner/plugin",
            "pushed_at": "2026-11-12T00:00:00Z",
        })

    def test_graphql_rejects_batch_wide_errors(self):
        self.session.request.return_value = response(200, {
            "data": {"nodes": None},
            "errors": [{"message": "Unsupported selection"}],
        })

        with self.assertRaisesRegex(GitHubAPIError, "Unsupported selection"):
            self.client.refresh(["existing"])

    def test_graphql_splits_slow_batches_without_losing_repositories(self):
        ids = [f"id-{index}" for index in range(12)]
        self.session.request.side_effect = [
            response(502, {"message": "Bad Gateway"}),
            requests.Timeout(),
            response(200, {"data": {"nodes": [public_node(node_id) for node_id in ids[:3]]}}),
            response(200, {"data": {"nodes": [public_node(node_id) for node_id in ids[3:6]]}}),
            response(200, {"data": {"nodes": [public_node(node_id) for node_id in ids[6:]]}}),
        ]

        self.assertEqual(list(self.client.refresh(ids)), ids)

        batches = [call.kwargs["json"]["variables"]["ids"] for call in self.session.request.call_args_list]
        self.assertEqual(batches, [ids, ids[:6], ids[:3], ids[3:6], ids[6:]])

    @patch("scripts.github_api.time.sleep")
    def test_graphql_unrecoverable_small_batch_fails_after_three_attempts(self, sleep):
        ids = [f"id-{index}" for index in range(8)]
        self.session.request.return_value = response(502, {"message": "Bad Gateway"})

        with self.assertRaisesRegex(GitHubAPIError, "HTTP 502"):
            self.client.refresh(ids)

        batches = [call.kwargs["json"]["variables"]["ids"] for call in self.session.request.call_args_list]
        self.assertEqual(batches, [ids, ids[:4], ids[:4], ids[:4]])
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [1, 2])

    def test_graphql_does_not_split_permission_validation_or_rate_limits(self):
        cases = [
            response(403, {"message": "Forbidden"}),
            response(422, {"message": "Invalid selection"}),
            response(429, {"message": "Rate limited"}, **{"retry-after": "120"}),
            response(503, {"message": "Service unavailable"}, **{"retry-after": "120"}),
        ]
        for failure in cases:
            with self.subTest(status=failure.status_code):
                self.session.request.reset_mock()
                self.session.request.return_value = failure
                with self.assertRaisesRegex(GitHubAPIError, f"HTTP {failure.status_code}"):
                    self.client.refresh([f"id-{index}" for index in range(50)])
                self.session.request.assert_called_once()

    def test_rest_distinguishes_missing_from_failed_requests(self):
        full_repo = {"full_name": "owner/plugin", "private": False, "contents_url": "value"}
        self.session.request.side_effect = [
            response(200, full_repo),
            response(404, {"message": "Not Found"}),
            response(200, {"full_name": "owner/internal", "private": False, "visibility": "internal"}),
            response(403, {"message": "Forbidden"}),
        ]

        self.assertEqual(self.client.repository("owner/plugin"), full_repo)
        self.assertIsNone(self.client.repository("owner/missing"))
        self.assertIsNone(self.client.repository("owner/internal"))
        with self.assertRaisesRegex(GitHubAPIError, "HTTP 403"):
            self.client.repository("owner/forbidden")
