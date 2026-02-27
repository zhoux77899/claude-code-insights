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
│   ├── fetch_repos.sh              # Search GitHub code API for plugin repos
│   ├── dedupe_repos.py             # Deduplicate search results
│   ├── sort_repos.py               # Fetch repo metadata and sort by stars
│   └── chronicle_repos.py          # Maintain rolling history snapshots
├── ui/                             # Vite + React + TypeScript frontend
├── requirements.txt                # Python dependencies
└── README.md
```

## Data Generation Pipeline

The workflow `.github/workflows/plugins-daily-insight.yml` runs on:

- schedule: daily at `00:00 UTC`
- manual trigger: `workflow_dispatch`

Pipeline steps:

1. `scripts/fetch_repos.sh` queries GitHub Search API (`filename:marketplace.json path:.claude-plugin`).
2. `scripts/dedupe_repos.py` merges paged search responses and removes duplicates.
3. `scripts/sort_repos.py` fetches repository metadata and sorts by `stargazers_count`.
4. `scripts/chronicle_repos.py` updates rolling historical metrics in `plugins/history.json`.
5. Workflow generates/updates:
   - `plugins/repos.json`
   - `plugins/history.json`
   - `plugins/cached-repos.txt`
   - `plugins/plugins-daily-insight.md`

Detailed plugin data schema and usage examples are documented in [plugins/README.md](plugins/README.md).

## Web UI and Deployment

- Frontend source lives in `ui/`.
- GitHub Pages deployment is managed by `.github/workflows/github-pages-deploy.yml`.
- During deployment, data files are copied into `ui/data/`:
  - `plugins/repos.json` -> `ui/data/plugins-repos.json`
  - `plugins/history.json` -> `ui/data/plugins-history.json`
- Vite `base` is set to `/claude-code-insights/` for Pages routing.

UI-specific setup and architecture are documented in [ui/README.md](ui/README.md).

## Quick Start

### Prerequisites

- Python `3.13` (matches workflow runtime)
- Node.js `20` and npm (matches workflow runtime)
- `jq` (required by `fetch_repos.sh`)
- GitHub token in `GITHUB_TOKEN` (recommended to avoid strict rate limits)

### 1) Generate Data Locally

```bash
pip install -r requirements.txt
export GITHUB_TOKEN=your_github_token_here

bash scripts/fetch_repos.sh
python scripts/dedupe_repos.py --input /tmp/response.jsonl --output /tmp/repos.json
python scripts/sort_repos.py --input /tmp/repos.json --output plugins/repos.json --cached-repos-list plugins/cached-repos.txt
python scripts/chronicle_repos.py --input plugins/repos.json --output plugins/history.json
```

### 2) Run UI Locally

```bash
cd ui
npm ci
npm run dev
```

## Configuration

- `GITHUB_TOKEN`: GitHub API token used by shell/Python scripts and workflows.
- `GITHUB_SSL_VERIFY` (optional): set to `false` to disable TLS verification in `sort_repos.py` requests.
- `--keeping-days` (optional): `chronicle_repos.py` flag to change history retention days (default `30`).

## Data and Reporting Outputs

- Main report: [plugins/plugins-daily-insight.md](plugins/plugins-daily-insight.md)
- Latest ranked dataset: [plugins/repos.json](plugins/repos.json)
- Historical snapshots: [plugins/history.json](plugins/history.json)

Counts and top repositories are intentionally not hardcoded in this README because they change on every run.

## License

MIT License. See [LICENSE](LICENSE).
