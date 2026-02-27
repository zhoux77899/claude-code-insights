# Claude Code Insights UI

Frontend application for browsing and exploring Claude Code plugin repositories.

## Features

- Repository list with search and multiple sort modes.
- Repository detail modal with plugin metadata from `.claude-plugin/marketplace.json`.
- Star trend visualization based on historical snapshots.
- Progressive loading/infinite loading behavior for large datasets.
- Dark/light theme support.

## Tech Stack

- React `19`
- TypeScript `5`
- Vite `7`
- HeroUI + Tailwind CSS
- Recharts (trend charts)
- Vitest + Testing Library

## Data Source and Fallback Strategy

The UI fetches pre-generated data from two sources:

1. Remote raw files on GitHub (primary):
   - `plugins/repos.json`
   - `plugins/history.json`
2. Local bundled files under `/data` (fallback):
   - `/data/plugins-repos.json`
   - `/data/plugins-history.json`

At build/deploy time, `.github/workflows/github-pages-deploy.yml` copies data from repository `plugins/` into `ui/data/`.

## Getting Started

### Prerequisites

- Node.js `20`+
- npm

### Install Dependencies

```bash
npm ci
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint and Test

```bash
npm run lint
npm run test:run
```

## Project Structure

```text
ui/
├── src/
│   ├── components/    # Cards, charts, layout, shared UI
│   ├── hooks/         # Data loading, search, sorting, theme, trends
│   ├── contexts/      # Modal context
│   ├── types/         # GitHub/data typings
│   └── utils/         # Formatters, constants, helpers
├── public/            # Static assets (icons/fonts)
├── data/              # Copied plugin datasets during CI deploy
└── package.json
```

## Deployment Notes

- Vite base path is configured as `/claude-code-insights/` for GitHub Pages.
- Build output is generated in `ui/dist`.
- GitHub Pages workflow uploads `ui/dist` as deployment artifact.

## Related Documentation

- Root project overview: [../README.md](../README.md)
- Plugins data schema and files: [../plugins/README.md](../plugins/README.md)
