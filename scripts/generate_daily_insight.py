"""Generate a validated daily snapshot from the previous published artifacts."""

import argparse
import json
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory

from .chronicle_repos import METRIC_FIELDS, update_history
from .github_api import GRAPHQL_BATCH_SIZE, GitHubAPIError, GitHubClient, GitHubRateLimitError


LOGGER = logging.getLogger(__name__)
REPOSITORY_NAME = re.compile(r"[\w.-]+/[\w.-]+", re.ASCII)
MAX_NEW_REQUESTS = 200
REST_RESERVE = 50
REFRESHABLE_FIELDS = (*METRIC_FIELDS, "watchers_count", "pushed_at", "default_branch", "node_id")


def read_json(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"Expected a JSON object in {path.name}")
    return data


def validate_repository(repo: dict) -> None:
    if (
        not isinstance(repo, dict)
        or repo.get("private") is not False
        or type(repo.get("id")) is not int
        or not isinstance(repo.get("full_name"), str)
        or not REPOSITORY_NAME.fullmatch(repo["full_name"])
        or not isinstance(repo.get("name"), str)
        or not isinstance(repo.get("html_url"), str)
        or not repo["html_url"].startswith("https://github.com/")
        or not isinstance(repo.get("pushed_at"), str)
        or any(type(repo.get(field)) is not int or repo[field] < 0 for field in METRIC_FIELDS)
    ):
        raise ValueError("Snapshot contains a repository with invalid or nonpublic metadata")
    if datetime.fromisoformat(repo["pushed_at"]).tzinfo is None:
        raise ValueError("Snapshot contains a repository with a timezone-free pushed_at")


def refresh_repositories(
    client: GitHubClient, previous: dict[int, dict], candidates: set[str], discovered: set[str]
) -> tuple[dict[int, dict], set[int], set[str], set[str]]:
    by_node = {repo["node_id"]: repo for repo in previous.values() if repo.get("node_id")}
    # The baseline is ranked by stars. Distribute its popular repositories across requests.
    node_ids = list(by_node)
    batch_count = (len(node_ids) + GRAPHQL_BATCH_SIZE - 1) // GRAPHQL_BATCH_SIZE
    refresh_order = [node_id for start in range(batch_count) for node_id in node_ids[start::batch_count]]
    refreshed = client.refresh(refresh_order) if refresh_order else {}
    repositories = previous.copy()
    sampled_ids = set()
    retired_names = set()
    renamed = set()

    for node_id, metrics in refreshed.items():
        repo = by_node[node_id]
        repo_id = repo["id"]
        if metrics.get("private") is True:
            del repositories[repo_id]
            retired_names.add(repo["full_name"].casefold())
            if metrics.get("full_name"):
                retired_names.add(metrics["full_name"].casefold())
            continue

        changes = {field: metrics[field] for field in REFRESHABLE_FIELDS if field in metrics}
        if "watchers_count" in changes and "watchers" in repo:
            changes["watchers"] = changes["watchers_count"]
        if metrics.get("full_name", repo["full_name"]) != repo["full_name"]:
            # Fetch a complete REST object so renamed repositories keep consistent URLs and owner data.
            renamed.add(metrics["full_name"])
        repositories[repo_id] = {**repo, **changes}
        sampled_ids.add(repo_id)

    known_names = {
        repo["full_name"].casefold() for repo in repositories.values() if repo.get("node_id")
    } | retired_names
    queue = {name.casefold(): name for name in sorted(renamed) if name.casefold() not in retired_names}
    for name in sorted(candidates, key=str.casefold) + sorted(discovered, key=str.casefold):
        if name.casefold() not in known_names:
            queue.setdefault(name.casefold(), name)
    attempted = 0
    for key, name in list(queue.items()):
        remaining = client.remaining("core")
        if attempted >= MAX_NEW_REQUESTS or (remaining is not None and remaining <= REST_RESERVE):
            break
        attempted += 1
        try:
            details = client.repository(name)
        except GitHubRateLimitError:
            break
        except GitHubAPIError:
            LOGGER.warning("REST repository onboarding paused after an API error")
            break
        del queue[key]
        if details is not None:
            validate_repository(details)
            repositories[details["id"]] = details
            sampled_ids.add(details["id"])

    return repositories, sampled_ids, retired_names, set(queue.values())


def markdown_report(repos: list[dict], now: datetime, discovery: str) -> str:
    def description(repo: dict, limit: int) -> str:
        value = " ".join((repo.get("description") or "No description").split())
        return value[:limit].replace("|", r"\|")

    lines = [
        "# Claude Code Plugins Daily Insight", "",
        f"> Generated at: {now:%Y-%m-%d %H:%M:%S} UTC",
        f"> Indexed repositories: {len(repos)}",
        f"> Repository discovery: {discovery}", "", "---", "", "## Top 30 High-Scoring Repositories", "",
        "| # | Repository | Stars | Forks | Last Updated | Description |",
        "|---|------------|-------|-------|--------------|-------------|",
    ]
    for rank, repo in enumerate(repos[:30], start=1):
        lines.append(
            f"| {rank} | [{repo['name']}]({repo['html_url']}) | ⭐{repo['stargazers_count']} "
            f"| 🍴{repo['forks_count']} | {repo['pushed_at'][:10]} | {description(repo, 60)} |"
        )
    lines.extend(["", "## Active Repositories (Last 7 Days)", ""])
    cutoff = now - timedelta(days=7)
    active = [repo for repo in repos if datetime.fromisoformat(repo["pushed_at"]) > cutoff]
    for repo in active[:15]:
        lines.append(f"- [{repo['name']}]({repo['html_url']}) - ⭐{repo['stargazers_count']} - {description(repo, 80)}")
    return "\n".join(lines) + "\n"


def generate_snapshot(client: GitHubClient, baseline: Path, output: Path, now: datetime) -> str:
    if output.exists() or baseline.resolve() in output.resolve().parents:
        raise ValueError("The output must be a new directory outside the baseline")

    previous_snapshot = read_json(baseline / "repos.json")
    previous_items = previous_snapshot.get("items")
    if not isinstance(previous_items, list) or previous_snapshot.get("total_count") != len(previous_items):
        raise ValueError("Invalid baseline repository count")
    for repo in previous_items:
        validate_repository(repo)
    previous = {repo["id"]: repo for repo in previous_items}
    if len(previous) != len(previous_items):
        raise ValueError("Duplicate repository IDs in baseline")
    history = read_json(baseline / "history.json")
    cached_names = (baseline / "cached-repos.txt").read_text(encoding="utf-8").splitlines()
    candidates = {name for name in cached_names if REPOSITORY_NAME.fullmatch(name)}
    candidates.update(repo["full_name"] for repo in previous_items if not repo.get("node_id"))
    discovered = set()
    try:
        discovered, capped = client.discover()
        discovery = "completed (GitHub capped this query at 1,000 results)" if capped else "completed"
    except GitHubAPIError:
        LOGGER.warning("Repository discovery degraded. Refreshing the existing inventory.")
        discovery = "degraded (refreshed the existing inventory)"

    repositories, sampled_ids, retired_names, pending = refresh_repositories(client, previous, candidates, discovered)
    if not sampled_ids:
        raise ValueError("No repository metrics were refreshed. Keeping the previous snapshot.")
    repos = sorted(repositories.values(), key=lambda repo: (-repo["stargazers_count"], repo["full_name"].casefold()))
    names = set()
    for repo in repos:
        validate_repository(repo)
        name = repo["full_name"].casefold()
        if name in names:
            raise ValueError("Duplicate repository names in candidate snapshot")
        names.add(name)
        if repo.get("temp_clone_token") is not None:
            repo["temp_clone_token"] = None

    retained_history = {name: days for name, days in history.items() if name.casefold() not in retired_names}
    for repo_id in sampled_ids:
        old = previous.get(repo_id)
        new_name = repositories[repo_id]["full_name"]
        if old and old["full_name"] != new_name and old["full_name"] in retained_history:
            old_history = retained_history.pop(old["full_name"])
            retained_history[new_name] = {**old_history, **retained_history.get(new_name, {})}
    history = update_history(retained_history, [repo for repo in repos if repo["id"] in sampled_ids], now)
    pending = {name for name in pending if name.casefold() not in names | retired_names}
    cache = [repo["full_name"] for repo in repos] + sorted(pending, key=str.casefold)
    snapshot = {
        "total_count": len(repos),
        "last_updated_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "items": repos,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=output.parent) as temporary:
        staging = Path(temporary) / "snapshot"
        staging.mkdir()
        for name, data in (("repos.json", snapshot), ("history.json", history)):
            with (staging / name).open("w", encoding="utf-8", newline="\n") as file:
                json.dump(data, file, indent=2, ensure_ascii=False)
        (staging / "cached-repos.txt").write_text("\n".join(cache) + "\n", encoding="utf-8", newline="\n")
        (staging / "plugins-daily-insight.md").write_text(
            markdown_report(repos, now, discovery), encoding="utf-8", newline="\n"
        )
        staging.rename(output)

    return (
        f"- Discovery: {discovery}\n"
        f"- Discovered repositories: {len(discovered)}\n"
        f"- Refreshed repositories: {len(sampled_ids)}\n"
        f"- Prior metrics reused: {len(repos) - len(sampled_ids)}\n"
        f"- New records queued for REST: {len(pending)}\n"
        f"- Remaining GraphQL points: {client.remaining('graphql')}\n"
        f"- Remaining REST requests: {client.remaining('core')}\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", type=Path, default=Path("plugins"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        parser.exit(1, "GITHUB_TOKEN is required for GitHub API requests.\n")
    try:
        with GitHubClient(token) as client:
            summary = generate_snapshot(client, args.baseline, args.output, datetime.now(timezone.utc))
    except (GitHubAPIError, OSError, ValueError) as error:
        parser.exit(1, f"Daily snapshot generation failed: {error}\n")
    print(summary, end="")
    if summary_path := os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(summary_path, "a", encoding="utf-8") as file:
            file.write(f"## Daily insight snapshot\n\n{summary}")


if __name__ == "__main__":
    main()
