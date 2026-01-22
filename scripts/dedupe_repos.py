"""
Deduplicate GitHub repos file by full_name field.
Reads JSONL and outputs a single JSON array with duplicates removed.
"""

import argparse
import json
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(
        description="Deduplicate GitHub repos file by full_name field."
    )
    parser.add_argument(
        "--input",
        type=str,
        default="insights/response.jsonl",
        help="Path to input response.jsonl file (default: insights/response.jsonl)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="insights/repos.json",
        help="Path to output deduplicated repos.json file (default: insights/repos.json)",
    )
    return parser.parse_args()


def dedupe_repos(input_file: str, output_file: str) -> None:
    # Check if input file exists
    if not Path(input_file).exists():
        raise ValueError(f"Error: Input file not found: {input_file}")

    # Read entire file content
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Track seen full_names and unique records
    seen_full_names = set()
    unique_records = []
    json_decoder = json.JSONDecoder()
    idx = 0
    obj_count = 0
    total_items = 0

    while idx < len(content):
        # Skip whitespace
        while idx < len(content) and content[idx].isspace():
            idx += 1
        if idx >= len(content):
            break

        # Try to decode a JSON object
        try:
            obj, idx = json_decoder.raw_decode(content, idx)
            obj_count += 1
            items = obj.get("items", [])
            total_items += len(items)

            for record in items:
                # full_name is nested in the "repository" object
                repo = record.get("repository", {})
                full_name = repo.get("full_name")

                if full_name and full_name not in seen_full_names:
                    seen_full_names.add(full_name)
                    unique_records.append(record)

        except json.JSONDecodeError as e:
            print(f"Warning: Failed to parse at index {idx}: {e}")
            idx += 1  # Skip the problematic character

    print(f"JSON objects processed: {obj_count}")
    print(f"Total items found: {total_items}")

    # Write output as single JSON block with total_count
    output_data = {
        "total_count": len(unique_records),
        "items": unique_records
    }
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    # Print summary
    print(f"Deduplicate GitHub Repos Done!")
    print(f"  - Unique records: {len(unique_records)}")
    print(f"  - Output saved to: {output_file}")


if __name__ == "__main__":
    args = parse_args()
    dedupe_repos(args.input, args.output)
