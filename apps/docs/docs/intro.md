# Anplexa Platform Documentation

Welcome to the official Anplexa Platform documentation. This guide covers the complete architecture, development setup, and implementation patterns for the Anplexa monorepo.

## What is Anplexa?

Anplexa is a comprehensive AI companion platform built with **Clean Architecture principles**, enabling users to:

- Chat with intelligent AI companions without authentication (guest mode)
- Create personalized conversations with context memory
- Manage preferences and companion personality settings
- Upgrade from free to premium features
- Integrate with payment processing (Stripe)

## Key Features

✅ **Clean Architecture** - Separated domain, use cases, repositories, and infrastructure layers
✅ **Type-Safe** - 100% TypeScript coverage with strict type checking
✅ **Monorepo Structure** - Shared packages across multiple applications
✅ **Dependency Injection** - Awilix-based DI container for testability
✅ **Repository Pattern** - 9 fully abstracted repositories for data access
✅ **Custom Hooks** - 4 extracted React hooks for chat functionality
✅ **Shared UI Components** - @anplexa/ui library with 6+ reusable components

## Architecture Highlights

### Applications
- **@anplexa/api** - REST API server (Express.js)
- **@anplexa/companions** - Chat companion UI (React + Vite)
- **@anplexa/docs** - Documentation site (Docusaurus)

### Core Packages
- **@anplexa/core** - Clean Architecture implementation
- **@anplexa/database** - Drizzle ORM + PostgreSQL schemas
- **@anplexa/services** - Business logic services (Auth, Email, Stripe, AI)
- **@anplexa/contracts** - Shared TypeScript interfaces
- **@anplexa/ui** - Shared React components

## Documentation Structure

### Architecture Guides
- [Clean Architecture Audit](./architecture/clean-architecture-audit.md) - Complete implementation metrics and audit findings
- [Repository Pattern](./architecture/repository-pattern.md) - 9 repositories and data access abstraction
- [Dependency Injection](./architecture/dependency-injection.md) - Awilix container setup and usage

### Development Guides
- [Monorepo Guide](./development/monorepo-guide.md) - pnpm workspaces and Turborepo setup

### Frontend Documentation
- [Custom Hooks](./frontend/custom-hooks.md) - useGuestChat, useMessagePersistence, usePreferences, useUpgradeModal

### Improvement Plans
- [Clean Architecture Transition](./improvement-plans/clean-architecture-transition.md) - Phase progress and completion status

## Quick Links

| Topic | Description |
|-------|-------------|
| [Architecture Overview](./architecture/clean-architecture-audit.md) | Complete audit of Clean Architecture implementation |
| [Set Up Development](./development/monorepo-guide.md) | Install and configure monorepo |
| [Repository Pattern](./architecture/repository-pattern.md) | How data access works |
| [Dependency Injection](./architecture/dependency-injection.md) | How dependencies are managed |
| [React Hooks](./frontend/custom-hooks.md) | Custom hooks for chat functionality |

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build

# Run type checking
pnpm typecheck

# Run tests
pnpm test
```

## Project Status

**Current Phase**: Phase 4 Complete ✅

- **Phase 3**: Clean Architecture Backend (Complete)
  - Domain entities, use cases, repositories, DI container
  - 85% architecture maturity

- **Phase 4**: Frontend Decomposition (Complete)
  - @anplexa/ui shared component library
  - 4 custom hooks extracted
  - Monorepo structure optimized

## Next Steps

See [Clean Architecture Transition Plan](./improvement-plans/clean-architecture-transition.md) for completed phases and upcoming improvements.
