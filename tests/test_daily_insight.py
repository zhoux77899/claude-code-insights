import json
import unittest
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import Mock

from scripts.generate_daily_insight import generate_snapshot, refresh_repositories
from scripts.github_api import GitHubAPIError, GitHubClient


NOW = datetime(2026, 11, 21, 4, tzinfo=timezone.utc)


def repository(id_, name, stars):
    return {
        "id": id_,
        "node_id": f"node-{id_}",
        "full_name": f"owner/{name}",
        "name": name,
        "pushed_at": "2026-11-20T00:00:00Z",
        "html_url": f"https://github.com/owner/{name}",
        "private": False,
        "stargazers_count": stars,
        "forks_count": 2,
        "subscribers_count": 3,
        "watchers_count": stars,
        "topics": ["claude-code"],
    }


class DailyInsightTests(unittest.TestCase):
    def setUp(self):
        temporary = TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.baseline = Path(temporary.name) / "baseline"
        self.baseline.mkdir()
        self.output = Path(temporary.name) / "output"
        self.first = repository(1, "first", 10)
        self.second = repository(2, "second", 20)
        (self.baseline / "repos.json").write_text(json.dumps({
            "total_count": 2,
            "items": [self.first, self.second],
        }), encoding="utf-8")
        (self.baseline / "history.json").write_text(json.dumps({
            "owner/first": {"2026-11-21": {"stargazers_count": 10}},
            "owner/second": {"2026-11-20": {"stargazers_count": 20}},
        }), encoding="utf-8")
        (self.baseline / "cached-repos.txt").write_text("owner/first\nowner/second\n", encoding="utf-8")
        self.client = Mock(spec=GitHubClient)
        self.client.discover.return_value = (set(), False)
        self.client.remaining.return_value = 500
        self.client.refresh.return_value = {"node-1": {"stargazers_count": 30, "node_id": "updated-id"}}

    def generate(self):
        return generate_snapshot(self.client, self.baseline, self.output, NOW)

    def read(self, name):
        return (self.output / name).read_text(encoding="utf-8")

    def test_discovery_outage_preserves_inventory_and_individual_stale_rows(self):
        self.client.discover.side_effect = GitHubAPIError("HTTP 503")
        with self.assertLogs("scripts.generate_daily_insight", level="WARNING"):
            summary = self.generate()

        snapshot = json.loads(self.read("repos.json"))
        self.assertEqual(snapshot["total_count"], 2)
        first, second = snapshot["items"]
        self.assertEqual(first["stargazers_count"], 30)
        self.assertEqual(first["topics"], self.first["topics"])
        self.assertEqual(first["node_id"], "updated-id")
        self.assertEqual(second, self.second)
        history = json.loads(self.read("history.json"))
        self.assertEqual(history["owner/first"]["2026-11-21"]["stargazers_count"], 30)
        self.assertEqual(history["owner/second"], {"2026-11-20": {"stargazers_count": 20}})
        self.assertIn("Discovery: degraded", summary)
        self.assertIn("discovery: degraded", self.read("plugins-daily-insight.md"))
        self.client.repository.assert_not_called()

    def test_batch_error_leaves_baseline_and_output_intact(self):
        before = {path.name: path.read_bytes() for path in self.baseline.iterdir()}
        self.client.refresh.side_effect = GitHubAPIError("whole batch failed")
        with self.assertRaisesRegex(GitHubAPIError, "whole batch failed"):
            self.generate()
        self.assertFalse(self.output.exists())
        self.assertEqual({path.name: path.read_bytes() for path in self.baseline.iterdir()}, before)

    def test_private_repository_is_removed_and_candidates_wait_for_rest_quota(self):
        self.client.refresh.return_value["node-2"] = {"private": True}
        self.client.discover.return_value = ({"owner/new", "owner/second"}, True)
        self.client.remaining.side_effect = lambda resource: 50 if resource == "core" else 500

        self.generate()

        self.assertEqual(self.read("cached-repos.txt").splitlines(), ["owner/first", "owner/new"])
        self.assertNotIn("owner/second", json.loads(self.read("history.json")))
        self.assertEqual(json.loads(self.read("repos.json"))["total_count"], 1)
        self.assertIn("1,000 results", self.read("plugins-daily-insight.md"))
        self.client.repository.assert_not_called()

    def test_invalid_new_rest_object_does_not_publish(self):
        self.client.discover.return_value = ({"owner/new"}, False)
        self.client.repository.return_value = {"private": False, "id": 3}
        with self.assertRaisesRegex(ValueError, "invalid or nonpublic metadata"):
            self.generate()
        self.assertFalse(self.output.exists())

    def test_star_ranked_baseline_is_spread_across_batches(self):
        baseline = {rank: repository(rank, f"repo-{rank}", 120 - rank) for rank in range(120)}
        self.client.refresh.return_value = {}

        refresh_repositories(self.client, baseline, set(), set())

        ids, = self.client.refresh.call_args.args
        self.assertEqual(set(ids), {f"node-{rank}" for rank in baseline})
        self.assertEqual(ids[:6], [f"node-{rank}" for rank in (0, 3, 6, 9, 12, 15)])


if __name__ == "__main__":
    unittest.main()
