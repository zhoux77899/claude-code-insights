"""
Sort repositories by star count (fetched from GitHub API)
"""

import argparse
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import requests


def parse_args():
    parser = argparse.ArgumentParser(
        description="Deduplicate GitHub repos file by full_name field."
    )
    parser.add_argument(
        "--input",
        type=str,
        default="insights/repos.json",
        help="Path to input repos.json file (default: insights/repos.json)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="insights/sorted_repos.json",
        help="Path to output sorted_repos.json file (default: insights/sorted_repos.json)",
    )
    parser.add_argument(
        "--cached-repos-list",
        type=str,
        default=None,
        help="Path to cached repos list file (default: None)",
    )
    return parser.parse_args()


def fetch_repo_info(
    repo_full_name: str,
    session: requests.Session,
    token: str | None = None,
    verify: bool = True
) -> dict:
    """Fetch star count for a single repository from GitHub API"""
    url = f"https://api.github.com/repos/{repo_full_name}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    try:
        resp = session.get(url, headers=headers, timeout=10, verify=verify)
        if resp.status_code == 200:
            return resp.json()
        print(f"  Warning: {resp.status_code} for {repo_full_name}")
        return dict()
    except Exception as e:
        print(f"  Error fetching {repo_full_name}: {e}")
        return dict()


def sort_repos_by_stars(input_file: str, output_file: str, cached_repos_list_file: str | None = None) -> None:
    # Check if input file exists
    if not Path(input_file).exists():
        raise ValueError(f"Error: Input file not found: {input_file}")

    # Read input
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    searched_repos = [item.get("repository", {}).get("full_name") for item in data.get("items", [])]

    # Check if cached repo list is provided
    if cached_repos_list_file and Path(cached_repos_list_file).exists():
        with open(cached_repos_list_file, "r", encoding="utf-8") as f:
            cached_repos = [line.strip("\n") for line in f.readlines()]
    else:
        cached_repos = []

    repos = set(searched_repos).union(set(cached_repos))
    total = len(repos)

    print(f"Fetching star counts for {total} repositories...")

    # Setup session
    session = requests.Session()
    token = os.environ.get("GITHUB_TOKEN")
    verify_ssl = os.environ.get("GITHUB_SSL_VERIFY", "true").lower() != "false"

    # Track seen seen_repos and unique records
    unique_ids = set()
    unique_records = []

    # Fetch repo info
    for i, full_name in enumerate(repos):
        if full_name:
            if repo_info := fetch_repo_info(full_name, session, token, verify=verify_ssl):
                if repo_info["id"] not in unique_ids:
                    unique_records.append(repo_info)
                    unique_ids.add(repo_info.get("id", -1))
            # Progress update
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{total}...")
            # Rate limit handling for unauthenticated requests
            if not token and (i + 1) % 10 == 0:
                time.sleep(1)  # Stay under 60 requests/minute

    # Sort by star count (descending)
    sorted_repos = sorted(
        unique_records,
        key=lambda x: x.get("stargazers_count", 0),
        reverse=True
    )

    # Write output as single JSON block with total_count
    output_data = {
        "total_count": len(sorted_repos),
        "last_updated_time": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "items": sorted_repos
    }
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"Generated {output_file} with {len(sorted_repos)} repositories")

    # Write cached repo list
    if cached_repos_list_file:
        with open(cached_repos_list_file, "w", encoding="utf-8") as f:
            for repo in sorted_repos:
                if repo:
                    f.write(f"{repo.get("full_name", "")}\n")

        print(f"Generated {cached_repos_list_file} with {len(sorted_repos)} repositories")


if __name__ == "__main__":
    args = parse_args()
    sort_repos_by_stars(args.input, args.output, args.cached_repos_list)
