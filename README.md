# Claude Code Insights

A daily-updated collection of insights for the Claude Code ecosystem, automatically tracking the most popular and active Claude Code repositories.

## Overview

This repository maintains an automated daily report of:

- **Top 30 High-Scoring Repositories** - The most starred Claude Code plugins, skills, and related projects
- **Active Repositories** - Projects updated within the last 7 days
- **Structured Data** - JSON data for programmatic access

## Files

```
claude-code-insights/
├── .github/workflows/
│   └── daily-insight.yml     # Automated daily insight generation
├── insights/
│   ├── daily-insight.md      # Daily markdown report
│   └── data.json             # Structured JSON data
├── .gitignore
└── README.md
```

## Automated Reports

### insights/daily-insight.md

Daily generated markdown report containing:
- Top 30 repositories by stars
- Repositories active in the last 7 days
- Repository metadata (stars, forks, description, update date)

### insights/data.json

Structured JSON data for programmatic access:
```json
{
  "generated_at": "2024-01-01T00:00:00Z",
  "total_count": 123,
  "repos": [
    {
      "name": "repository-name",
      "full_name": "owner/repository-name",
      "url": "https://github.com/owner/repository-name",
      "description": "Repository description",
      "stars": 1000,
      ...
    }
  ]
}
```

## How It Works

1. **GitHub Actions Workflow** runs daily at 00:00 UTC
2. **Searches GitHub** for repositories with topics: `claude-code`, `claude-code-plugin`, or `claude-skills`
3. **Generates Reports** with top repositories and recent activity
4. **Commits Changes** automatically to this repository

### Workflow Schedule

| Event | Time (UTC) |
|-------|------------|
| Scheduled Run | Daily 00:00 |
| Manual Trigger | On demand |

## Usage

### Viewing Today's Insights

```bash
# Read the daily markdown report
cat insights/daily-insight.md

# Parse the structured JSON data
cat insights/data.json | jq '.repos[0]'
```

### Manual Trigger

1. Go to the repository's **Actions** tab
2. Select **"Claude Code Insight"** workflow
3. Click **"Run workflow"**

### Local Development

```bash
# Install dependencies (if any)
npm install

# Test workflow locally with act
act -j generate-insight

# Or run the script portion manually
export GITHUB_TOKEN=your_token
bash -c "$(grep -A100 'run: |' .github/workflows/daily-insight.yml | tail -n +2)"
```

## Contributing

To add your repository to the insights:

1. Add appropriate topics to your GitHub repository:
   - `claude-code`
   - `claude-code-plugin`
   - `claude-skills`

2. Ensure your repository has at least 30 stars

Repositories will be automatically discovered and ranked in the next daily update.

## License

MIT License - see [LICENSE](LICENSE) for details.