# Claude Code Insights

Automated data collection, ranking, and visualization for the Claude Code plugin ecosystem.

## What This Project Provides

- Daily indexed repository data for Claude Code plugins.
- Structured JSON artifacts for downstream usage.
- A generated Markdown insight report (Top 30 + recently active repos).
- A React-based web UI deployed to GitHub Pages.

## Repository Structure

```text
claude-code-insights/
├── .github/workflows/
│   ├── plugins-daily-insight.yml   # Daily data generation pipeline
│   └── github-pages-deploy.yml     # Build and deploy UI to GitHub Pages
├── plugins/
│   ├── README.md
│   ├── repos.json                  # Latest ranked repository dataset
│   ├── history.json                # Time-series metrics history
│   ├── cached-repos.txt            # Cached repository list
│   └── plugins-daily-insight.md    # Generated Markdown report
├── scripts/
│   ├── generate_daily_insight.py   # Build and validate a candidate snapshot
│   ├── github_api.py               # Bounded GitHub Search, GraphQL, and REST requests
│   └── chronicle_repos.py          # Maintain rolling history snapshots
├── ui/                             # Vite + React + TypeScript frontend
├── requirements.txt                # Python dependencies
└── README.md
```

## Data Generation Pipeline

The workflow `.github/workflows/plugins-daily-insight.yml` runs on:

- schedule: daily at `00:00 UTC`
- manual trigger: `workflow_dispatch`, with `dry_run` enabled by default. A dry run uploads the validated snapshot as an artifact. Publication is available from `main`.

Pipeline steps:

1. Code search discovers public repositories with `filename:marketplace.json path:.claude-plugin`, up to the GitHub limit of 1,000 results. When discovery is unavailable, the run refreshes the existing inventory and reports degraded discovery.
2. GraphQL refreshes existing repository metrics in batches. REST supplies full objects for new repositories within the remaining quota. The run carries deferred candidates forward and records history only for successfully refreshed repositories.
3. After validation, the workflow commits the four generated files together and calls the Pages workflow:
   - `plugins/repos.json`
   - `plugins/history.json`
   - `plugins/cached-repos.txt`
   - `plugins/plugins-daily-insight.md`

Detailed plugin data schema and usage examples are documented in [plugins/README.md](plugins/README.md).

## Web UI and Deployment

- Frontend source lives in `ui/`.
- GitHub Pages deployment is managed by `.github/workflows/github-pages-deploy.yml`.
- During deployment, Vite bundles the two fallback data files from `ui/public/data/`.
- Vite `base` is set to `/claude-code-insights/` for Pages routing.

UI-specific setup and architecture are documented in [ui/README.md](ui/README.md).

## Quick Start

### Prerequisites

- Python `3.13` (matches workflow runtime)
- Node.js `24` and npm (matches workflow runtime)
- GitHub API token in `GITHUB_TOKEN`

### 1) Generate Data Locally

```bash
pip install -r requirements.txt
export GITHUB_TOKEN=your_github_token_here

python -m scripts.generate_daily_insight --baseline plugins --output "$(mktemp -d)/daily-insight"
```

### 2) Run UI Locally

```bash
cd ui
npm ci
npm run dev
```

## Configuration

- `GITHUB_TOKEN` supplies GitHub API authentication for the daily generator. Hosted runs use the repository's Actions token.
- `--keeping-days` (optional): `chronicle_repos.py` flag to change history retention days (default `30`).

## Data and Reporting Outputs

- Main report: [plugins/plugins-daily-insight.md](plugins/plugins-daily-insight.md)
- Latest ranked dataset: [plugins/repos.json](plugins/repos.json)
- Historical snapshots: [plugins/history.json](plugins/history.json)

Counts and top repositories are intentionally not hardcoded in this README because they change on every run.

## License

MIT License. See [LICENSE](LICENSE).
