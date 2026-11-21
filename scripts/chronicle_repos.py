"""
Maintain GitHub repos history of stargazers, watchers, and forks counts over time.
"""

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path


METRIC_FIELDS = ("stargazers_count", "subscribers_count", "forks_count")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Maintain GitHub repos history."
    )
    parser.add_argument(
        "--input",
        type=str,
        default="insights/sorted_repos.json",
        help="Path to input sorted_repos.json file (default: insights/sorted_repos.json)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="insights/history.json",
        help="Path to output history.json file (default: insights/history.json)",
    )
    parser.add_argument(
        "--keeping-days",
        type=int,
        default=30,
        help="Number of days to keep history (default: 30)",
    )
    return parser.parse_args()


def update_history(
    history: dict,
    refreshed_repositories: list[dict],
    sampled_at: datetime,
    keeping_days: int = 30,
) -> dict:
    cutoff = (sampled_at.date() - timedelta(days=keeping_days - 1)).isoformat()
    snapshots = {
        name: {day: metrics for day, metrics in days.items() if day >= cutoff}
        for name, days in history.items()
    }
    day = sampled_at.date().isoformat()
    for repo in refreshed_repositories:
        snapshots.setdefault(repo["full_name"], {})[day] = {
            field: repo.get(field, 0) for field in METRIC_FIELDS
        }
    return {name: days for name, days in snapshots.items() if days}


def chronicle_repos(input_file: str, output_file: str, keeping_days: int = 30) -> None:
    data = json.loads(Path(input_file).read_text(encoding="utf-8"))
    output = Path(output_file)
    history = json.loads(output.read_text(encoding="utf-8")) if output.exists() else {}
    timestamp = data.get("last_updated_time")
    sampled_at = datetime.fromisoformat(timestamp) if timestamp else datetime.now(timezone.utc)
    history = update_history(history, data.get("items", []), sampled_at, keeping_days)
    output.write_text(json.dumps(history, indent=2), encoding="utf-8")
    print(f"Generated {output_file} with {len(history)} repositories")


if __name__ == "__main__":
    args = parse_args()
    chronicle_repos(args.input, args.output, args.keeping_days)
