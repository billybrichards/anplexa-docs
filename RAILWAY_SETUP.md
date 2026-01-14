# Anplexa Railway CI/CD & Environment Setup Guide

This document provides complete instructions for setting up the Anplexa monorepo with Railway for both development and production environments.

## Overview

The Anplexa monorepo uses Railway for deployment with the following structure:

- **Development Environment**: Deployed from `develop` branch
- **Production Environment**: Deployed from `main` branch
- **Databases**: PostgreSQL and Redis for both environments
- **Services**: API, Companions, Funnel, and Docs apps

## Prerequisites

1. Railway account at https://railway.app
2. Railway CLI installed: `npm install -g @railway/cli`
3. GitHub repository with Anplexa code
4. Node.js 20+ and pnpm 8+

## Step 1: Create Railway Projects

### Development Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "Create New Project"
3. Select "Blank Project"
4. Name: `anplexa-dev`
5. Copy the Project ID for later use

### Production Project

1. Repeat steps above
2. Name: `anplexa-prod`
3. Copy the Project ID for later use

## Step 2: Add Databases to Both Projects

### PostgreSQL Setup

For each project (dev and prod):

```bash
# Link to your project
railway link --project <PROJECT_ID>

# Add PostgreSQL service
railway add --service postgres
```

This creates a PostgreSQL service with automatic DATABASE_URL environment variable.

### Redis Setup

For each project (dev and prod):

```bash
railway link --project <PROJECT_ID>

# Add Redis service
railway add --service redis
```

This creates a Redis service with automatic REDIS_URL environment variable.

## Step 3: Add Application Services

For the development project:

```bash
railway link --project <ANPLEXA_DEV_PROJECT_ID>

# Add API service
railway add --service api --source apps/api

# Add Companions service
railway add --service companions --source apps/companions

# Add Funnel service
railway add --service funnel --source apps/funnel

# Add Docs service
railway add --service docs --source apps/docs
```

Repeat the same for the production project with ANPLEXA_PROD_PROJECT_ID.

## Step 4: Configure GitHub Secrets

In your GitHub repository settings, add the following secrets:

### Required Secrets

```
RAILWAY_TOKEN=<your-railway-api-token>
RAILWAY_DEV_PROJECT_ID=<development-project-id>
RAILWAY_PROD_PROJECT_ID=<production-project-id>
```

To get your Railway API token:
1. Go to Railway Dashboard > Account Settings
2. Click "Create API Token"
3. Copy the token to GitHub Secrets as `RAILWAY_TOKEN`

## Step 5: Configure Environment Variables

### Development Environment

For each service in the development project, set these variables:

**API Service:**
```
NODE_ENV=development
DATABASE_URL=${{postgres.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
PORT=3000
```

**Companions Service:**
```
NODE_ENV=development
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=http://localhost:3000
PORT=3001
```

**Funnel Service:**
```
NODE_ENV=development
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=http://localhost:3000
PORT=3002
```

**Docs Service:**
```
NODE_ENV=development
PORT=3003
```

### Production Environment

For each service in the production project, set these variables:

**API Service:**
```
NODE_ENV=production
DATABASE_URL=${{postgres.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
PORT=3000
LOG_LEVEL=info
```

**Companions Service:**
```
NODE_ENV=production
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=https://api.anplexa.com
PORT=3001
```

**Funnel Service:**
```
NODE_ENV=production
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=https://api.anplexa.com
PORT=3002
```

**Docs Service:**
```
NODE_ENV=production
PORT=3003
```

### Setting Variables via CLI

```bash
# For development project
railway link --project <ANPLEXA_DEV_PROJECT_ID>
railway variables set NODE_ENV=development
railway variables set DATABASE_URL='${{postgres.DATABASE_URL}}'
railway variables set REDIS_URL='${{redis.REDIS_URL}}'

# Repeat for each service using --service flag
railway variables --service api set PORT=3000
```

## Step 6: Configure Build and Start Commands

For each service, set the appropriate commands:

### API Service

**Build Command:**
```bash
pnpm install --frozen-lockfile && pnpm build --filter=api
```

**Start Command:**
```bash
pnpm start --filter=api
```

### Companions Service

**Build Command:**
```bash
pnpm install --frozen-lockfile && pnpm build --filter=companions
```

**Start Command:**
```bash
pnpm start --filter=companions
```

### Funnel Service

**Build Command:**
```bash
pnpm install --frozen-lockfile && pnpm build --filter=funnel
```

**Start Command:**
```bash
pnpm start --filter=funnel
```

### Docs Service

**Build Command:**
```bash
pnpm install --frozen-lockfile && pnpm build --filter=docs
```

**Start Command:**
```bash
pnpm start --filter=docs
```

## Step 7: Configure GitHub Actions Workflows

The workflows are already configured in `.github/workflows/`:

- `lint.yml` - Runs on all branches
- `test.yml` - Runs on all branches
- `build.yml` - Runs on all branches
- `deploy-api.yml` - Deploys to Railway on main/develop
- `deploy-companions.yml` - Deploys to Railway on main/develop
- `deploy-funnel.yml` - Deploys to Railway on main/develop
- `deploy-docs.yml` - Deploys to Railway on main/develop

These workflows automatically:
1. Trigger on `develop` branch → Deploy to development environment
2. Trigger on `main` branch → Deploy to production environment
3. Run linting and tests before deployment

## Step 8: Test the Setup

1. Create a test commit on the `develop` branch
2. Push to GitHub
3. Go to Actions tab and monitor the workflow
4. Check Railway dashboard for deployment progress
5. Verify services are running with `railway ps`

```bash
railway link --project <ANPLEXA_DEV_PROJECT_ID>
railway ps
```

## Database Management

### Access Database via Railway CLI

```bash
# Connect to PostgreSQL
railway link --project <PROJECT_ID>
railway run psql

# Or use environment variables
railway run node -e "console.log(process.env.DATABASE_URL)"
```

### Database Migrations

To run migrations during deployment:

1. Update your build command:

```bash
pnpm install --frozen-lockfile && pnpm build --filter=api && pnpm migration:run --filter=api
```

2. Or create a Railway service job for migrations before API starts

## Monitoring and Logs

### View Logs

```bash
# Development
railway link --project <ANPLEXA_DEV_PROJECT_ID>
railway logs --service api

# Production
railway link --project <ANPLEXA_PROD_PROJECT_ID>
railway logs --service api
```

### Monitor Deployments

In GitHub Actions:
1. Go to Actions tab
2. Click on the workflow run
3. Check deployment status and logs

In Railway Dashboard:
1. Select project
2. Click on service
3. View deployment history and logs

## Environment Variable Reference

### Railway Variable Syntax

Use `${{ServiceName.VARIABLE_NAME}}` to reference variables from other services:

```
DATABASE_URL=${{postgres.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
```

### Common Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| NODE_ENV | production/development | Both |
| PORT | Service port | Both |
| DATABASE_URL | ${{postgres.DATABASE_URL}} | Both |
| REDIS_URL | ${{redis.REDIS_URL}} | Dev (API only) |
| LOG_LEVEL | debug/info/warn/error | Production |

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs for error message
2. Verify RAILWAY_TOKEN is valid
3. Ensure project IDs are correct
4. Check service build commands are working locally

### Database Connection Errors

1. Verify DATABASE_URL is set correctly
2. Run migrations if needed
3. Check database is running: `railway ps`

### Services Not Starting

1. Check build command output in logs
2. Verify environment variables are set
3. Ensure start command is correct
4. Check port is available (3000, 3001, 3002, 3003)

## CI/CD Flow

```
Push to develop branch
    ↓
GitHub Actions: Lint, Test, Build
    ↓
Deploy to Development (Railway)
    ↓
Services start with dev environment variables
    ↓
Databases accessible via DATABASE_URL

Push to main branch
    ↓
GitHub Actions: Lint, Test, Build
    ↓
Deploy to Production (Railway)
    ↓
Services start with prod environment variables
    ↓
Databases accessible via DATABASE_URL
```

## Useful Railway CLI Commands

```bash
# List all projects
railway projects

# Link to project
railway link --project <PROJECT_ID>

# View services
railway ps

# View logs
railway logs --service <SERVICE_NAME>

# Pull environment variables
railway variables

# Set variables
railway variables set KEY=VALUE

# Deploy
railway up --service <SERVICE_NAME>

# View deployment history
railway logs --service <SERVICE_NAME> --depl

# Execute commands with Railway env vars
railway run npm start
```

## Next Steps

1. Test deployment with a feature branch
2. Set up custom domains in Railway for each environment
3. Configure monitoring and alerts
4. Set up backup strategy for databases
5. Document any custom environment variables specific to your setup

For more information, visit:
- Railway Docs: https://docs.railway.app
- Railway CLI Docs: https://docs.railway.app/reference/cli-api
