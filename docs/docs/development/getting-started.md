---
sidebar_position: 1
---

# Getting Started

This guide walks you through setting up the Anplexa platform for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18.0+ | Runtime for all applications |
| **pnpm** | 8.0+ | Package manager (recommended) |
| **PostgreSQL** | 15+ | Primary database |
| **Git** | 2.30+ | Version control |

### Optional Tools

| Tool | Purpose |
|------|---------|
| **SQLite** | Local development database (alternative to PostgreSQL) |
| **Docker** | Container-based PostgreSQL setup |
| **Ollama** | Local LLM inference (if not using remote) |

## Repository Structure

The Anplexa platform consists of three main repositories:

```
anplexa/
├── 2-terminal-companion/        # Backend API (Express.js)
├── v0-ai-companion-prototype/   # Companions App (Next.js)
└── Funnel-Forge/                # Marketing Funnel (Vite + Express)
```

## Clone and Setup

### 1. Clone All Repositories

```bash
# Create workspace directory
mkdir anplexa && cd anplexa

# Clone Backend API
git clone https://github.com/your-org/2-terminal-companion.git api

# Clone Companions App
git clone https://github.com/your-org/v0-ai-companion-prototype.git companions

# Clone Funnel App
git clone https://github.com/your-org/Funnel-Forge.git funnel
```

### 2. Install Dependencies

```bash
# Backend API
cd api && pnpm install && cd ..

# Companions App
cd companions && pnpm install && cd ..

# Funnel App
cd funnel && pnpm install && cd ..
```

### 3. Configure Environment Variables

Copy the example environment files for each application:

```bash
# Backend API
cp api/.env.example api/.env

# Companions App
cp companions/.env.example companions/.env.local

# Funnel App
cp funnel/.env.example funnel/.env
```

See the [Environment Setup](/docs/development/environment-setup) guide for detailed configuration.

### 4. Database Setup

#### Option A: PostgreSQL (Recommended)

```bash
# Create database
createdb anplexa_dev

# Set DATABASE_URL in api/.env
# DATABASE_URL=postgresql://user:password@localhost:5432/anplexa_dev

# Run migrations
cd api && pnpm db:push
```

#### Option B: SQLite (Quick Start)

```bash
# Set DATABASE_URL in api/.env for SQLite
# DATABASE_URL=file:./data/companion.db

# Run migrations
cd api && pnpm db:push
```

### 5. Seed Initial Data (Optional)

```bash
# Create admin user and seed Stripe products
cd api && pnpm stripe:seed
```

## Running Locally

### Start All Services

Open three terminal windows/tabs:

**Terminal 1 - Backend API:**
```bash
cd api
pnpm dev
# Runs on http://localhost:5000
```

**Terminal 2 - Companions App:**
```bash
cd companions
pnpm dev
# Runs on http://localhost:3000
```

**Terminal 3 - Funnel App:**
```bash
cd funnel
pnpm dev
# Client runs on http://localhost:5000
# Server runs on same port
```

### Development Commands Reference

| Application | Command | Description |
|-------------|---------|-------------|
| **API** | `pnpm dev` | Start development server with hot reload |
| **API** | `pnpm build` | Compile TypeScript to JavaScript |
| **API** | `pnpm start` | Start production server |
| **API** | `pnpm db:generate` | Generate Drizzle migrations |
| **API** | `pnpm db:push` | Push schema changes to database |
| **API** | `pnpm db:studio` | Open Drizzle Studio (database GUI) |
| **Companions** | `pnpm dev` | Start Next.js development server |
| **Companions** | `pnpm build` | Create production build |
| **Companions** | `pnpm start` | Start production server |
| **Companions** | `pnpm lint` | Run ESLint |
| **Funnel** | `pnpm dev` | Start Vite development server |
| **Funnel** | `pnpm dev:client` | Start client only (port 5000) |
| **Funnel** | `pnpm build` | Create production build |
| **Funnel** | `pnpm start` | Start production server |
| **Funnel** | `pnpm check` | Run TypeScript type checking |

## Quick Start Guide

### Minimum Viable Setup

For the fastest path to running the platform locally:

1. **Clone API and Companions only** (Funnel is optional for basic development)
2. **Use SQLite** instead of PostgreSQL
3. **Skip Stripe** (set dummy values in `.env`)
4. **Skip Ollama** (use mock responses for testing)

```bash
# Quick setup script
mkdir anplexa && cd anplexa

# Clone repos
git clone https://github.com/your-org/2-terminal-companion.git api
git clone https://github.com/your-org/v0-ai-companion-prototype.git companions

# Setup API
cd api
pnpm install
cp .env.example .env
# Edit .env: Set DATABASE_URL=file:./data/companion.db
pnpm db:push

# Setup Companions
cd ../companions
pnpm install
cp .env.example .env.local
# Edit .env.local: Set API_URL=http://localhost:5000

# Run both
# Terminal 1: cd api && pnpm dev
# Terminal 2: cd companions && pnpm dev
```

### Testing the Setup

1. Open http://localhost:3000 in your browser
2. Click "Continue as Guest" or register a new account
3. Send a chat message to verify the API connection
4. Check the API terminal for request logs

## Common Issues

### Port Conflicts

If ports 3000 or 5000 are in use:

```bash
# Find process using port
lsof -i :3000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change ports in .env files
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
pg_isready

# Check connection string format
# postgresql://username:password@host:port/database
```

### CORS Errors

Ensure `FRONTEND_URL` in API matches the Companions app URL:

```bash
# In api/.env
FRONTEND_URL=http://localhost:3000
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Next Steps

- [Environment Setup](/docs/development/environment-setup) - Configure all environment variables
- [Testing](/docs/development/testing) - Run and write tests
- [Architecture Overview](/docs/architecture/overview) - Understand the system design
- [API Reference](/docs/api/authentication) - Explore the API endpoints
