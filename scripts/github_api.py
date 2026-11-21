"""Read public repository data from GitHub with bounded retries."""

import logging
import re
import time
from dataclasses import dataclass
from datetime import datetime

import requests


LOGGER = logging.getLogger(__name__)
API_URL = "https://api.github.com"
SEARCH_QUERY = "filename:marketplace.json path:.claude-plugin"
SEARCH_PAGE_SIZE = 100
SEARCH_PAGE_LIMIT = 10
GRAPHQL_BATCH_SIZE = 50
MAX_ATTEMPTS = 3
MAX_RETRY_SECONDS = 90
REPOSITORY_NAME = re.compile(r"[A-Za-z0-9_-]+/(?!\.{1,2}\Z)[A-Za-z0-9_.-]+")
TOKEN_PATTERN = re.compile(r"(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]+")
RATE_HEADERS = (
    "x-ratelimit-resource",
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "retry-after",
)
REFRESH_QUERY = """
query RefreshRepositories($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Repository {
      id
      nameWithOwner
      visibility
      url
      defaultBranchRef { name }
      pushedAt
      stargazerCount
      forkCount
      watchers(first: 1) { totalCount }
    }
  }
  rateLimit { cost remaining resetAt }
}
"""


class GitHubAPIError(RuntimeError):
    """A GitHub response cannot be used by the refresh pipeline."""


class GitHubRateLimitError(GitHubAPIError):
    """A GitHub API rate limit cannot be retried within the request budget."""


@dataclass(frozen=True)
class RateBudget:
    remaining: int
    reset: int | None


def nonnegative_int(value):
    return type(value) is int and value >= 0


def header_int(value):
    return int(value) if isinstance(value, str) and value.isascii() and value.isdecimal() else None


class GitHubClient:
    def __init__(self, token: str, session: requests.Session | None = None):
        if not token:
            raise GitHubAPIError("GITHUB_TOKEN is required")
        self.token = token
        self.session = session if session is not None else requests.Session()
        self.session.headers.update({
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        })
        self.budgets: dict[str, RateBudget] = {}

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.session.close()

    def remaining(self, resource: str) -> int | None:
        budget = self.budgets.get(resource)
        if budget is None or (budget.reset is not None and budget.reset <= time.time()):
            return None
        return budget.remaining

    def _redact(self, message: str) -> str:
        # Replace secrets before trimming, including when the server echoes our token.
        safe = TOKEN_PATTERN.sub("<redacted>", message.replace(self.token, "<redacted>"))
        return " ".join(safe.split())[:240]

    def _response_details(self, response: requests.Response, payload: dict | None) -> str:
        fields = f"HTTP {response.status_code} request_id={response.headers.get('x-github-request-id', '-')}"
        for header in RATE_HEADERS:
            if header in response.headers:
                fields += f" {header}={response.headers[header]}"
        if payload is not None and isinstance(payload.get("message"), str):
            fields += f" message={payload['message']}"
        return self._redact(fields)

    @staticmethod
    def _rate_delay(budget: RateBudget | None, attempt: int, retry_after: int | None) -> float:
        if budget is not None and budget.remaining == 0 and budget.reset is not None:
            until_reset = max(0, budget.reset - time.time() + 1)
            return max(until_reset, retry_after or 0)
        if retry_after is not None:
            return retry_after
        return 60 * (2 ** attempt)

    @staticmethod
    def _pause(delay: float, deadline: float, error: GitHubAPIError):
        if time.monotonic() + delay >= deadline:
            raise error
        LOGGER.info("GitHub request waiting %.1fs before retry", delay)
        time.sleep(delay)

    def _request(
        self, method: str, path: str, resource: str, *, allow_missing=False, **kwargs
    ) -> dict | None:
        deadline = time.monotonic() + MAX_RETRY_SECONDS
        previous_budget = self.budgets.get(resource)
        if self.remaining(resource) == 0:
            delay = self._rate_delay(previous_budget, 0, None)
            self._pause(delay, deadline, GitHubRateLimitError(f"{resource}: quota exhausted"))

        for attempt in range(MAX_ATTEMPTS):
            timeout = min(15, deadline - time.monotonic())
            if timeout <= 0:
                raise GitHubAPIError(f"{resource}: request time budget exhausted")
            try:
                response = self.session.request(method, f"{API_URL}{path}", timeout=timeout, **kwargs)
            except (requests.ConnectionError, requests.Timeout) as error:
                problem = GitHubAPIError(f"{resource}: {type(error).__name__}")
                LOGGER.warning("%s", problem)
                delay = 2 ** attempt
            else:
                payload = None
                try:
                    decoded = response.json()
                    if isinstance(decoded, dict):
                        payload = decoded
                except ValueError:
                    pass

                remaining = header_int(response.headers.get("x-ratelimit-remaining"))
                budget = None
                if remaining is not None:
                    budget = RateBudget(remaining, header_int(response.headers.get("x-ratelimit-reset")))
                elif resource == "graphql" and payload is not None:
                    data = payload.get("data")
                    rate = data.get("rateLimit") if isinstance(data, dict) else None
                    if isinstance(rate, dict) and nonnegative_int(rate.get("remaining")):
                        reset = rate.get("resetAt")
                        try:
                            reset = int(datetime.fromisoformat(reset).timestamp()) if isinstance(reset, str) else None
                        except ValueError:
                            reset = None
                        budget = RateBudget(rate["remaining"], reset)
                if budget is not None:
                    self.budgets[resource] = budget

                status = response.status_code
                details = self._response_details(response, payload)
                LOGGER.log(logging.INFO if status == 200 else logging.WARNING, "%s: %s", resource, details)
                message = str(payload.get("message", "")) if payload is not None else ""
                retry_after = header_int(response.headers.get("retry-after"))
                graph_errors = payload.get("errors", []) if resource == "graphql" and payload is not None else []
                graph_limited = isinstance(graph_errors, list) and any(
                    isinstance(error, dict) and (
                        error.get("type") == "RATE_LIMITED"
                        or "rate limit" in str(error.get("message", "")).lower()
                    ) for error in graph_errors
                )
                http_limited = status == 429 or (
                    status == 403 and (retry_after is not None or remaining == 0 or "rate limit" in message.lower())
                )
                if http_limited or graph_limited:
                    problem = GitHubRateLimitError(f"{resource}: rate limited ({details})")
                    delay = self._rate_delay(budget, attempt, retry_after)
                elif status == 200:
                    if payload is None:
                        raise GitHubAPIError(f"{resource}: invalid JSON object ({details})")
                    return payload
                elif allow_missing and status in (404, 410):
                    return None
                elif 500 <= status < 600:
                    problem = GitHubAPIError(f"{resource}: {details}")
                    delay = max(2 ** attempt, retry_after or 0)
                else:
                    raise GitHubAPIError(f"{resource}: {details}")

            if attempt == MAX_ATTEMPTS - 1:
                raise problem
            self._pause(delay, deadline, problem)

    def discover(self) -> tuple[set[str], bool]:
        names = set()
        first_page_total = None
        for page in range(1, SEARCH_PAGE_LIMIT + 1):
            payload = self._request("GET", "/search/code", "code_search", params={
                "q": SEARCH_QUERY,
                "per_page": SEARCH_PAGE_SIZE,
                "page": page,
            })
            total = payload.get("total_count")
            items = payload.get("items")
            if not nonnegative_int(total) or not isinstance(items, list) or len(items) > SEARCH_PAGE_SIZE:
                raise GitHubAPIError(f"code_search: invalid response on page {page}")
            if payload.get("incomplete_results") is not False:
                raise GitHubAPIError(f"code_search: incomplete or unverified results on page {page}")
            if first_page_total is None:
                first_page_total = total

            for item in items:
                repo = item.get("repository") if isinstance(item, dict) else None
                if not isinstance(repo, dict) or type(repo.get("private")) is not bool:
                    raise GitHubAPIError(f"code_search: invalid repository on page {page}")
                if not repo["private"]:
                    name = repo.get("full_name")
                    if not isinstance(name, str) or not REPOSITORY_NAME.fullmatch(name):
                        raise GitHubAPIError(f"code_search: invalid repository name on page {page}")
                    names.add(name)

            if page * SEARCH_PAGE_SIZE >= first_page_total:
                break
        capped = first_page_total > SEARCH_PAGE_LIMIT * SEARCH_PAGE_SIZE
        return names, capped

    def refresh(self, node_ids: list[str]) -> dict[str, dict]:
        repositories = {}
        for offset in range(0, len(node_ids), GRAPHQL_BATCH_SIZE):
            batch = node_ids[offset:offset + GRAPHQL_BATCH_SIZE]
            payload = self._request(
                "POST", "/graphql", "graphql",
                headers={"X-Github-Next-Global-ID": "1"},
                json={"query": REFRESH_QUERY, "variables": {"ids": batch}},
            )
            errors = payload.get("errors", [])
            if not isinstance(errors, list):
                raise GitHubAPIError("graphql: invalid error response")
            unavailable = set()
            for error in errors:
                path = error.get("path") if isinstance(error, dict) else None
                if (
                    isinstance(path, list) and len(path) >= 2 and path[0] == "nodes"
                    and nonnegative_int(path[1]) and path[1] < len(batch)
                    and error.get("type") in ("NOT_FOUND", "FORBIDDEN")
                ):
                    unavailable.add(path[1])
                else:
                    message = error.get("message", "unknown error") if isinstance(error, dict) else "unknown error"
                    raise GitHubAPIError(f"graphql: {self._redact(str(message))}")

            data = payload.get("data")
            nodes = data.get("nodes") if isinstance(data, dict) else None
            if not isinstance(nodes, list) or len(nodes) != len(batch):
                raise GitHubAPIError("graphql: expected one result per requested repository ID")
            rate = data.get("rateLimit")
            if isinstance(rate, dict) and nonnegative_int(rate.get("cost")):
                LOGGER.info("GraphQL batch returned %d entries with cost=%d", len(nodes), rate["cost"])

            for position, (node_id, node) in enumerate(zip(batch, nodes, strict=True)):
                if position in unavailable or node is None:
                    continue
                if not isinstance(node, dict) or not isinstance(node.get("id"), str) or not node["id"]:
                    raise GitHubAPIError("graphql: missing repository ID in batch results")
                # GraphQL returns the nodes in input order even when a legacy ID is upgraded.
                repositories[node_id] = self._repository_metrics(node)
        return repositories

    @staticmethod
    def _repository_metrics(node: dict) -> dict:
        visibility = node.get("visibility")
        if visibility in ("PRIVATE", "INTERNAL"):
            return {"private": True}

        name = node.get("nameWithOwner")
        stars = node.get("stargazerCount")
        forks = node.get("forkCount")
        watchers = node.get("watchers")
        subscribers = watchers.get("totalCount") if isinstance(watchers, dict) else None
        pushed_at = node.get("pushedAt")
        if (
            visibility != "PUBLIC" or not isinstance(name, str) or not REPOSITORY_NAME.fullmatch(name)
            or not all(nonnegative_int(value) for value in (stars, forks, subscribers))
            or (pushed_at is not None and not isinstance(pushed_at, str))
        ):
            raise GitHubAPIError("graphql: invalid repository metrics")

        details = {
            "node_id": node["id"],
            "full_name": name,
            "name": name.split("/", 1)[1],
            "private": False,
            "stargazers_count": stars,
            "watchers_count": stars,
            "forks_count": forks,
            "subscribers_count": subscribers,
        }
        if pushed_at is not None:
            details["pushed_at"] = pushed_at
        if isinstance(node.get("url"), str):
            details["html_url"] = node["url"]
        branch = node.get("defaultBranchRef")
        if isinstance(branch, dict) and isinstance(branch.get("name"), str):
            details["default_branch"] = branch["name"]
        return details

    def repository(self, full_name: str) -> dict | None:
        if not REPOSITORY_NAME.fullmatch(full_name):
            raise GitHubAPIError("core: invalid repository name")
        repo = self._request("GET", f"/repos/{full_name}", "core", allow_missing=True)
        if repo is None or repo.get("private") is True or repo.get("visibility", "public") != "public":
            return None
        if repo.get("private") is not False:
            raise GitHubAPIError("core: missing repository privacy in response")
        return repo
