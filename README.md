# Anplexa Monorepo

A unified monorepo consolidating the Anplexa ecosystem: Backend API, Companions App, Funnel App, and Documentation.

## Architecture

This monorepo follows **Clean Architecture** principles with clear separation between domain logic, use cases, and infrastructure. It uses **pnpm workspaces** and **Turborepo** for efficient builds and development.

### Project Structure

```
anplexa/
├── apps/
│   ├── api/                 # Backend API (Express + Drizzle ORM)
│   ├── companions/          # AI Companions UI (Next.js 15)
│   ├── funnel/              # Conversion Funnel (Next.js 15)
│   └── docs/                # Documentation (Docusaurus)
├── packages/
│   ├── core/                # Domain entities, use-cases, repository interfaces
│   ├── database/            # Database schema and client (Drizzle)
│   ├── services/            # External services (Stripe, AI, etc.)
│   ├── contracts/           # API contracts and DTOs
│   └── ui/                  # Shared React components (Shadcn)
├── docs/
│   └── history/             # Migration documentation
├── pnpm-workspace.yaml      # Workspace configuration
├── package.json             # Root dependencies
├── turbo.json               # Build orchestration
└── README.md
```

### Clean Architecture Layers

1. **Domain Layer** (`@anplexa/core/domain`):
   - Pure business entities (User, Message, Conversation)
   - Domain errors (ValidationError, AuthenticationError)
   - Zero external dependencies

2. **Use Case Layer** (`@anplexa/core/use-cases`):
   - Application business rules (RegisterUser, LoginUser, SendMessage)
   - Orchestrates domain entities
   - Depends only on domain and repository interfaces

3. **Interface Adapters** (`@anplexa/core/repositories`):
   - Repository interfaces defining data contracts
   - Repository implementations using Drizzle ORM
   - Adapters for external services

4. **Infrastructure** (`@anplexa/database`, `@anplexa/services`):
   - Database schema and migrations
   - External API clients (Stripe, Ollama)
   - Framework-specific code

### Apps Overview

- **API** (`apps/api`): Express.js REST API with Clean Architecture
  - All business logic in use-cases
  - Zero direct database queries in routes
  - Repository pattern for data access

- **Companions** (`apps/companions`): AI companion chat interface
  - Next.js 15 App Router
  - Uses `@anplexa/core` domain entities
  - Guest chat with localStorage persistence

- **Funnel** (`apps/funnel`): Conversion funnel with quiz and checkout
  - Next.js 15 App Router
  - Stripe integration for subscriptions
  - Custom hooks for session and tracking

- **Docs** (`apps/docs`): Technical documentation
  - Docusaurus v3
  - API reference and guides

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
