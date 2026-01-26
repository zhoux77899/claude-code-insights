"""
Maintain GitHub repos history of stargazers, watchers, and forks counts over time.
"""

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path


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


def chronicle_repos(input_file: str, output_file: str, keeping_days: int = 30) -> None:
    # Check if input file exists
    if not Path(input_file).exists():
        raise ValueError(f"Error: Input file not found: {input_file}")

    # Get current time in UTC
    current_time = datetime.now(timezone.utc)
    cutoff_time = current_time - timedelta(days=keeping_days)

    # Read input
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    last_updated_time = data.get("last_updated_time", current_time.strftime("%Y-%m-%d %H:%M:%S"))
    repos = {
        item.get("full_name"): {
            datetime.strptime(last_updated_time, "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d"): {
                "stargazers_count": item.get("stargazers_count", 0),
                "watchers_count": item.get("watchers_count", 0),
                "forks_count": item.get("forks_count", 0),
            }
        }
        for item in data.get("items", [])
    }

    # Read history if exists
    if Path(output_file).exists():
        with open(output_file, "r", encoding="utf-8") as f:
            history_data = json.load(f)
        for full_name, history in history_data.items():
            if full_name in repos:
                repos[full_name].update(history)
            else:
                repos[full_name] = history

    # Remove old histories beyond 30 days
    for full_name, history in repos.items():
        for date_str in list(history.keys()):
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            if date_obj < cutoff_time:
                repos[full_name].pop(date_str)

    # Write output
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(repos, f, indent=2)

    print(f"Generated {output_file} with {len(repos)} repositories")


if __name__ == "__main__":
    args = parse_args()
    chronicle_repos(args.input, args.output, args.keeping_days)
