"""
Sort repositories by star count (fetched from GitHub API)
"""

import argparse
import json
import os
import time
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
        help="Path to output sorted repos.json file (default: insights/sorted_repos.json)",
    )
    return parser.parse_args()


def fetch_star_count(
    repo_full_name: str,
    session: requests.Session,
    token: str | None = None,
    verify: bool = True
) -> int:
    """Fetch star count for a single repository from GitHub API"""
    url = f"https://api.github.com/repos/{repo_full_name}"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    try:
        resp = session.get(url, headers=headers, timeout=10, verify=verify)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("stargazers_count", 0)
        elif resp.status_code == 404:
            return 0
        else:
            print(f"  Warning: {resp.status_code} for {repo_full_name}")
            return 0
    except Exception as e:
        print(f"  Error fetching {repo_full_name}: {e}")
        return 0


def sort_repos_by_stars(input_file: str, output_file: str) -> None:
    # Check if input file exists
    if not Path(input_file).exists():
        raise ValueError(f"Error: Input file not found: {input_file}")

    # Read input
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    repos = data.get("items", [])
    total = len(repos)

    print(f"Fetching star counts for {total} repositories...")

    # Setup session
    session = requests.Session()
    token = os.environ.get("GITHUB_TOKEN")
    verify_ssl = os.environ.get("GITHUB_SSL_VERIFY", "true").lower() != "false"

    # Fetch star counts
    results = []
    for i, item in enumerate(repos):
        repo_info = item.get("repository", {})
        full_name = repo_info.get("full_name")

        if full_name:
            stars = fetch_star_count(full_name, session, token, verify=verify_ssl)
            repo_info["stargazers_count"] = stars
            item["repository"] = repo_info

            # Progress update
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{total}...")

            # Rate limit handling for unauthenticated requests
            if not token and (i + 1) % 10 == 0:
                time.sleep(1)  # Stay under 60 requests/minute

        results.append(item)

    # Sort by star count (descending)
    sorted_repos = sorted(
        results,
        key=lambda x: x.get("repository", {}).get("stargazers_count", 0),
        reverse=True
    )

    # Write output
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(sorted_repos, f, indent=2, ensure_ascii=False)

    print(f"Generated {output_file} with {len(sorted_repos)} repositories")


if __name__ == "__main__":
    args = parse_args()
    sort_repos_by_stars(args.input, args.output)
