# Anplexa Monorepo

A unified monorepo consolidating the Anplexa ecosystem: Backend API, Companions App, Funnel App, and Documentation.

## Architecture

This monorepo uses **pnpm workspaces** and **Turborepo** for efficient builds and development:

```
anplexa-monorepo/
├── apps/
│   ├── api/                 # Backend API service
│   ├── companions/          # AI Companions application
│   ├── funnel/              # Funnel application
│   └── docs/                # Documentation site
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── utils/               # Shared utilities
│   ├── config/              # Shared configuration
│   └── types/               # Shared TypeScript types
├── scripts/                 # Monorepo scripts
├── pnpm-workspace.yaml      # pnpm workspaces configuration
├── package.json             # Root package configuration
├── turbo.json              # Turborepo configuration
└── README.md               # This file
```

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (Recommended over npm/yarn for monorepos)

## Installation

1. Install pnpm if you haven't already:
   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

## Development

### Start all development servers
```bash
pnpm dev
```

### Build all packages and apps
```bash
pnpm build
```

### Run linting across the monorepo
```bash
pnpm lint
```

### Run tests
```bash
pnpm test
```

### Clean build artifacts
```bash
pnpm clean
```

## Working with Workspaces

### Add a dependency to a specific workspace
```bash
pnpm add package-name --filter @anplexa/api
```

### Run a script in a specific workspace
```bash
pnpm --filter @anplexa/api dev
```

### Run a script across all workspaces
```bash
pnpm -r run build
```

## Turborepo

Turborepo enables fast, incremental builds by:
- Caching build outputs
- Parallelizing independent tasks
- Managing task dependencies across the monorepo

### View Turborepo UI
```bash
turbo ui
```

## Project Structure Guidelines

### Apps
Each app in `apps/` should have:
- Own `package.json` with workspace name (e.g., `@anplexa/api`)
- Build scripts (`build`, `dev`, `lint`, `test`)
- Own dependencies listed in `package.json`

### Packages
Shared packages in `packages/` should:
- Be framework-agnostic when possible
- Export well-defined interfaces
- Have their own `package.json` with workspace name
- Include proper TypeScript types

## Contributing

1. Create a feature branch from `main`
2. Make your changes in the relevant workspace(s)
3. Run `pnpm build` and `pnpm test` to verify
4. Commit with clear messages referencing the workspace
5. Push and create a pull request

## License

Proprietary - Anplexa Inc.
