---
sidebar_position: 1
---

# Monorepo Development Guide

## Overview

Anplexa is a monorepo using **pnpm workspaces** and **Turborepo** for managing multiple applications and packages. This guide explains the structure, setup, and development workflows.

---

## Monorepo Structure

### Complete Directory Map

```
anplexa/
├── apps/
│   ├── api/                    # Express API server
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry point
│   │   │   ├── app.ts          # Express setup
│   │   │   ├── container.ts    # DI container
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── routes/         # API route handlers
│   │   │   └── docs/           # API documentation
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── companions/             # React companion app
│   │   ├── src/
│   │   │   ├── App.tsx         # Main app component
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Page components
│   │   │   └── services/       # Client services
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── funnel/                 # Marketing funnel app
│   │   └── ...
│   │
│   └── docs/                   # Docusaurus documentation
│       ├── docs/               # Markdown files
│       ├── src/                # React components
│       ├── package.json
│       └── docusaurus.config.js
│
├── packages/
│   ├── config/                 # Shared TS config
│   │   └── tsconfig.json       # Base config extended by all packages
│   │
│   ├── contracts/              # TypeScript interfaces & DTOs
│   │   ├── src/
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── core/                   # Clean Architecture core
│   │   ├── src/
│   │   │   ├── domain/         # Business entities
│   │   │   ├── use-cases/      # Application logic
│   │   │   ├── repositories/   # Data access abstraction
│   │   │   └── factories.ts    # Composition
│   │   └── package.json
│   │
│   ├── database/               # Drizzle ORM
│   │   ├── src/
│   │   │   ├── schema/         # Database schema
│   │   │   ├── client.ts       # ORM initialization
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── services/               # Business services
│   │   ├── src/
│   │   │   ├── auth/           # JWT, password hashing
│   │   │   ├── email/          # Email service
│   │   │   ├── stripe/         # Stripe integration
│   │   │   └── ai/             # AI/Ollama gateway
│   │   └── package.json
│   │
│   └── ui/                     # Shared React components
│       ├── src/
│       │   ├── components/     # Button, Card, Dialog, etc.
│       │   ├── lib/            # Utilities (cn helper)
│       │   └── index.ts
│       └── package.json
│
├── pnpm-workspace.yaml         # Workspace configuration
├── turbo.json                  # Turborepo cache config
├── package.json                # Root package.json
└── tsconfig.json               # Root TypeScript config
```

---

## Package Inventory

### Applications (3)

| Package | Type | Purpose | Framework |
|---------|------|---------|-----------|
| `@anplexa/api` | App | REST API server | Express |
| `@anplexa/companions` | App | Chat companion UI | React + Vite |
| `@anplexa/docs` | App | Documentation site | Docusaurus |

### Packages (7)

| Package | Type | Purpose | Exports |
|---------|------|---------|---------|
| `@anplexa/config` | Config | TS configuration | tsconfig.json |
| `@anplexa/contracts` | Types | API contracts | Interfaces |
| `@anplexa/core` | Library | Clean Architecture | Entities, Use Cases, Repositories |
| `@anplexa/database` | Library | ORM & Schema | Drizzle, Schema, Client |
| `@anplexa/services` | Library | Business Services | Auth, Email, Stripe, AI |
| `@anplexa/ui` | Library | React components | Button, Card, Dialog, etc. |

---

## Setup Instructions

### 1. Prerequisites

```bash
# Node.js 18+ required
node --version  # v18.0.0+

# pnpm 8+ required
npm install -g pnpm@latest
pnpm --version  # 8.0.0+
```

### 2. Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd anplexa

# Install dependencies (all workspaces)
pnpm install

# Install Turbo globally (optional but recommended)
npm install -g turbo
```

### 3. Environment Setup

Create `.env` files for each application:

**.env.local** (root, for API)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/anplexa

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# AI
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_GENERAL_MODEL=llama2
OLLAMA_LONG_FORM_MODEL=llama2

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Environment
NODE_ENV=development
```

### 4. Database Setup

```bash
# Generate database migrations
pnpm --filter @anplexa/database db:generate

# Run migrations
pnpm --filter @anplexa/database db:migrate

# Seed data (optional)
pnpm --filter @anplexa/database db:seed
```

---

## pnpm Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

This configuration tells pnpm about workspace packages. All directories under `apps/` and `packages/` are automatically discovered.

### Workspace Commands

```bash
# Install dependencies for entire workspace
pnpm install

# List all workspace packages
pnpm list --depth=0

# Show dependency tree
pnpm ls --depth=3

# Check for duplicate dependencies
pnpm dedupe
```

---

## Dependency Management

### Internal Dependencies

Internal packages use `workspace:*` protocol:

```json
{
  "dependencies": {
    "@anplexa/core": "workspace:*",
    "@anplexa/services": "workspace:*",
    "@anplexa/ui": "workspace:*"
  }
}
```

This creates symlinks during development, allowing:
- Real-time code changes without rebuilding
- Type-safe imports across packages
- Accurate error detection

### Adding Dependencies

```bash
# Add to specific package
pnpm --filter @anplexa/api add express

# Add dev dependency
pnpm --filter @anplexa/api add -D @types/express

# Add to multiple packages
pnpm add -r express  # All packages

# Add to root (avoid - use workspace packages instead)
pnpm add -w typescript
```

### Removing Dependencies

```bash
# Remove from specific package
pnpm --filter @anplexa/api remove express

# Remove from all packages
pnpm remove -r express
```

---

## Turborepo Configuration

### turbo.json

Turborepo enables smart caching and parallel task execution:

```json
{
  "extends": ["//"],
  "globalDependencies": ["**/.env.local", "**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "outputs": [".eslintcache"],
      "cache": true
    },
    "typecheck": {
      "outputs": [],
      "cache": true
    }
  }
}
```

### Task Execution

```bash
# Build all packages in dependency order
pnpm build

# Build only changed packages since last commit
turbo build --only-changed

# Run in parallel
turbo build --parallel

# Run with output
turbo build --verbose

# Force cache bypass
turbo build --force
```

---

## Development Workflows

### 1. Working on a Single Package

```bash
# Start development server for API
pnpm --filter @anplexa/api dev

# Start React app in watch mode
pnpm --filter @anplexa/companions dev

# Start docs site
pnpm --filter @anplexa/docs dev
```

### 2. Running Tests

```bash
# Test all packages
pnpm test

# Test specific package
pnpm --filter @anplexa/core test

# Test in watch mode
pnpm --filter @anplexa/core test:watch

# Test with coverage
pnpm test:coverage
```

### 3. Type Checking

```bash
# Check types in all packages
pnpm typecheck

# Check specific package
pnpm --filter @anplexa/core typecheck

# Watch mode
pnpm typecheck --watch
```

### 4. Linting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Lint specific package
pnpm --filter @anplexa/api lint
```

### 5. Building

```bash
# Build all packages in dependency order
pnpm build

# Build with watch mode
pnpm build --watch

# Build specific package
pnpm --filter @anplexa/core build

# Force rebuild
pnpm build --force
```

---

## Common Development Tasks

### Adding a New Package

```bash
# 1. Create package directory
mkdir packages/my-package
cd packages/my-package

# 2. Create package structure
mkdir -p src/{__tests__,lib}
touch src/index.ts
touch package.json
touch tsconfig.json

# 3. Create package.json
cat > package.json << 'EOF'
{
  "name": "@anplexa/my-package",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/index.d.ts"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@anplexa/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
EOF

# 4. Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "extends": "@anplexa/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [
    { "path": "../config" }
  ]
}
EOF

# 5. Install dependencies
cd ../.. && pnpm install

# 6. Add to root package.json workspace if needed
# (Usually automatic if directory is under apps/ or packages/)
```

### Adding a New App

```bash
# 1. Create app directory
mkdir apps/my-app
cd apps/my-app

# 2. Initialize with template (Vite for React, Express for servers)
# For React app:
pnpm create vite@latest . -- --template react-ts

# 3. Update package.json to reference monorepo packages
pnpm --filter @anplexa/my-app add @anplexa/core @anplexa/ui

# 4. Update tsconfig.json to extend base config
{
  "extends": "@anplexa/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}

# 5. Install and verify
cd ../.. && pnpm install
pnpm --filter @anplexa/my-app dev
```

### Dependency Graph Analysis

```bash
# View dependency tree
pnpm ls @anplexa/core --depth=3

# Find unused dependencies
pnpm why express

# Check for circular dependencies
turbo prune --scope=@anplexa/api
```

---

## Build Process

### TypeScript Compilation

Each package compiles independently:

```bash
# Development build (watch mode)
pnpm --filter @anplexa/core dev
# Output: packages/core/dist/

# Production build
pnpm --filter @anplexa/core build
# Output: packages/core/dist/ (optimized)
```

### Package Exports

Packages export through `dist/index.js` with types:

```typescript
// packages/core/src/index.ts
export { User, Conversation, Message, Session } from './domain/entities';
export { IUserRepository, IConversationRepository } from './repositories';
export {
  LoginUserUseCase,
  RegisterUserUseCase,
  CreateConversationUseCase,
} from './use-cases';
export { createAllUseCases } from './factories';

// packages/core/package.json
"exports": {
  ".": "./dist/index.js",
  "./types": "./dist/index.d.ts"
}
```

### Cross-Package Imports

```typescript
// Import from another workspace package
import { User, UserRepository } from '@anplexa/core';
import { JWTService, PasswordService } from '@anplexa/services';
import { Button, Card } from '@anplexa/ui';

// Type-safe with IntelliSense support
```

---

## Performance Optimization

### Turborepo Caching

Turborepo caches task outputs to speed up builds:

```bash
# First run - compiles and caches
pnpm build
# 42s

# Second run - uses cache
pnpm build
# 0.5s (cache hit)

# Force fresh build
pnpm build --force
# 42s
```

### Parallel Execution

```bash
# Default: respects dependencies
turbo build

# Force parallel (only if no dependencies)
turbo build --parallel

# With specific concurrency
turbo build --concurrency=4
```

### Dependency Optimization

```bash
# Deduplicate dependencies
pnpm dedupe

# Check for unused dependencies
pnpm ls --depth=0 --problems

# Update all dependencies
pnpm up --recursive --interactive
```

---

## Environment Configuration

### Shared Environment Variables

Place common variables in root `.env.local`:

```bash
# .env.local (root)
DATABASE_URL=postgresql://...
JWT_SECRET=...
NODE_ENV=development
```

### App-Specific Variables

```bash
# apps/api/.env.local
OLLAMA_BASE_URL=http://localhost:11434
STRIPE_SECRET_KEY=sk_test_...

# apps/companions/.env.local
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=Anplexa
```

### Loading Environment Variables

```typescript
// apps/api/src/index.ts
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL not set');
}
```

---

## Scripts Reference

### Root Scripts

```json
{
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev --parallel",
    "test": "turbo test",
    "test:coverage": "turbo test -- --coverage",
    "lint": "turbo lint",
    "lint:fix": "turbo lint -- --fix",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write ."
  }
}
```

### Package-Specific Scripts

```bash
# API
pnpm --filter @anplexa/api dev        # Start dev server
pnpm --filter @anplexa/api build      # Build for production
pnpm --filter @anplexa/api test       # Run tests

# Companions
pnpm --filter @anplexa/companions dev # Start dev server
pnpm --filter @anplexa/companions build # Build SPA

# Docs
pnpm --filter @anplexa/docs dev       # Start docs server
pnpm --filter @anplexa/docs build     # Build docs site
```

---

## Git Integration

### Commit Conventions

```bash
# Conventional commits scoped to packages
git commit -m "feat(api): add user registration endpoint"
git commit -m "feat(core): implement LoginUserUseCase"
git commit -m "fix(ui): button component styling issue"
git commit -m "docs(guides): add monorepo documentation"
```

### Branch Strategy

```bash
# Feature branch with package scope
git checkout -b feature/api-auth-endpoints
git checkout -b feature/ui-components
git checkout -b feature/core-repositories

# Fix branch
git checkout -b fix/core-session-validation
```

### Pre-commit Checks

```bash
# Run before committing
pnpm lint
pnpm typecheck
pnpm test

# Or use husky hooks (if configured)
# Automatically runs before commit
```

---

## Docker & Deployment

### Multi-Stage Build Example

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy pnpm files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy all source
COPY . .

# Build
RUN pnpm build --filter @anplexa/api

# Copy dist
FROM node:18-alpine
WORKDIR /app
COPY --from=0 /app/apps/api/dist ./
COPY --from=0 /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "index.js"]
```

### Production Build

```bash
# Build all packages for production
pnpm build

# Test production build locally
pnpm --filter @anplexa/api build
node apps/api/dist/index.js
```

---

## Troubleshooting

### Issue: "Cannot find module '@anplexa/core'"

**Cause**: Dependencies not installed

**Solution**:
```bash
pnpm install
pnpm install --recursive
```

### Issue: "Circular dependency detected"

**Cause**: Package A imports from B, B imports from A

**Solution**: Check import paths and restructure dependencies:
```bash
# Visualize dependency graph
pnpm ls @anplexa/core --depth=10
```

### Issue: "dist/ files not updated"

**Cause**: Files not rebuilt after changes

**Solution**:
```bash
# Watch mode for development
pnpm --filter @anplexa/core dev

# Force rebuild
pnpm build --force
```

### Issue: "pnpm install takes too time"

**Cause**: Network or large node_modules

**Solution**:
```bash
# Deduplicate
pnpm dedupe

# Use pnpm store prune
pnpm store prune

# Clear cache
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Quick Reference Commands

```bash
# Development
pnpm dev                                    # All apps in watch
pnpm --filter @anplexa/api dev             # Single app

# Building
pnpm build                                  # All packages
pnpm build --force                          # Skip cache
turbo build --only-changed                  # Changed only

# Testing
pnpm test                                   # All packages
pnpm --filter @anplexa/core test:watch     # Watch mode

# Code Quality
pnpm lint                                   # Lint all
pnpm lint:fix                               # Fix issues
pnpm typecheck                              # Type check all

# Dependencies
pnpm add express -r                         # Add to all
pnpm --filter @anplexa/api add lodash      # Add to one
pnpm dedupe                                 # Deduplicate

# Information
pnpm ls --depth=0                           # List packages
pnpm why express                            # Why included
turbo graph                                 # Dependency graph
```

---

## Conclusion

The Anplexa monorepo uses pnpm workspaces and Turborepo to efficiently manage multiple applications and packages. This structure provides:

- **Code Sharing** - Reusable packages across apps
- **Type Safety** - Shared types across workspace
- **Build Caching** - Fast incremental builds
- **Dependency Management** - Clear package boundaries
- **Scalability** - Easy to add new apps/packages

---

**Document Version**: 1.0
**Last Updated**: January 14, 2026
