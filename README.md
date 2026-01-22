# Claude Code Insights

A daily-updated collection of insights for the Claude Code ecosystem, automatically tracking the most popular and active Claude Code plugin repositories.

## Overview

This project automatically collects and organizes public data from the Claude Code plugin ecosystem through GitHub Actions automation.

### Core Functions

- **Data Collection**: Uses GitHub Search API to find repositories
- **Data Processing**: Python scripts deduplicate and sort repositories by star count
- **Report Generation**: Automatically generates daily Markdown reports
- **Structured Data**: Provides JSON data for programmatic access

### Technology Stack

- **GitHub Actions**: Daily automation at 00:00 UTC
- **Python 3.13**: Data processing with `requests` library
- **Bash**: GitHub API interaction scripts
- **jq**: JSON data extraction and formatting

## Statistics

| Metric | Value |
|--------|-------|
| Indexed Repositories | 899+ |
| Top Repository | awesome-chatgpt-prompts (143K+ stars) |
| Update Frequency | Daily at 00:00 UTC |

## Files

```
claude-code-insights/
├── .github/workflows/
│   └── plugins-daily-insight.yml     # Automated daily insight generation
├── plugins/
│   ├── cached-repos.txt              # Cached repositories list
│   ├── plugins-daily-insight.md      # Daily markdown report
│   └── repos.json                    # Structured JSON data
├── scripts/
│   ├── fetch_repos.sh                # GitHub API data fetching
│   ├── dedupe_repos.py               # Repository deduplication
│   └── sort_repos.py                 # Star count sorting
├── requirements.txt                  # Python dependencies
└── README.md                         # This documentation
```

## Automated Reports

### [Claude Code Plugins Daily Insight](plugins/plugins-daily-insight.md)

Daily generated markdown report containing:
- Top 30 repositories by stars
- Repositories active in the last 7 days
- Repository metadata (stars, forks, description, update date)

## How It Works

1. **GitHub Actions Workflow** runs daily at 00:00 UTC
2. **Searches GitHub** for repositories
3. **Markdown Report** is generated with top 30 and recently active repositories
4. **Automatic Commit** saves changes to this repository

### Workflow Schedule

| Event | Time (UTC) |
|-------|------------|
| Scheduled Run | Daily 00:00 |
| Manual Trigger | On demand |

## Local Development

### Prerequisites

- Python 3.13+
- GitHub Personal Access Token

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set GitHub Token
export GITHUB_TOKEN=your_github_token_here
```

### Running Locally

```bash
# Step 1: Fetch repositories from GitHub
bash scripts/fetch_repos.sh

# Step 2: Deduplicate repositories
python scripts/dedupe_repos.py --input /tmp/response.jsonl --output /tmp/repos.json

# Step 3: Sort by star count
python scripts/sort_repos.py --input /tmp/repos.json --output plugins/repos.json
```

### Manual Workflow Trigger

1. Go to the repository's Actions tab
2. Select "Claude Code Plugins Daily Insight" workflow
3. Click "Run workflow"

## FAQ

**Q: Can I trigger a manual update?**
A: Yes, go to the Actions tab and manually trigger the workflow.

**Q: What does "High-Scoring" mean?**
A: Repositories are ranked by their GitHub star count (stargazers_count).

## License

MIT License - see [LICENSE](LICENSE) for details.
