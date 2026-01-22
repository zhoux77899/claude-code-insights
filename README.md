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
│   └── plugins-daily-insight.yml     # Automated daily insight generation
├── plugins/
│   ├── plugins-daily-insight.md      # Daily markdown report
│   └── repos.json             # Structured JSON data
├── .gitignore
└── README.md
```

## Automated Reports

### [Claude Code Plugins Daily Insight](plugins/plugins-daily-insight.md)

Daily generated markdown report containing:
- Top 30 repositories by stars
- Repositories active in the last 7 days
- Repository metadata (stars, forks, description, update date)

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

## License

MIT License - see [LICENSE](LICENSE) for details.