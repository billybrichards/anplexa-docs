# Anplexa Railway Deployment - Complete Setup Summary

## Project Status: Ready for Railway Deployment

This document provides a comprehensive overview of the Railway CI/CD setup for Anplexa monorepo with full dev and prod environment configuration.

---

## Files Created

### 1. GitHub Actions Workflows (.github/workflows/)

#### CI/CD Workflows (Universal - All Branches)
- **lint.yml** (22 lines)
  - Triggers: Push to main/develop, Pull Requests
  - Action: Runs `pnpm lint` across entire monorepo
  - Cache: pnpm dependencies

- **test.yml** (22 lines)
  - Triggers: Push to main/develop, Pull Requests
  - Action: Runs `pnpm test` across entire monorepo
  - Cache: pnpm dependencies

- **build.yml** (22 lines)
  - Triggers: Push to main/develop, Pull Requests
  - Action: Runs `pnpm build` across entire monorepo
  - Cache: pnpm dependencies

#### Railway Deployment Workflows (Environment-Aware)

- **deploy-api.yml** (78 lines)
  - Trigger: Push to main/develop with path filters
  - Path Filters: apps/api/**, packages/**
  - Jobs:
    - deploy-dev: Triggers on develop → Railway dev environment
    - deploy-prod: Triggers on main → Railway prod environment
  - Actions:
    - Install Railway CLI
    - Build: `pnpm build --filter=api`
    - Test: `pnpm test --filter=api`
    - Deploy: `railway up --service api --environment [dev|prod]`

- **deploy-companions.yml** (74 lines)
  - Trigger: Push to main/develop with path filters
  - Path Filters: apps/companions/**, packages/**
  - Jobs: deploy-dev, deploy-prod
  - Actions: Build, Deploy to Railway

- **deploy-funnel.yml** (74 lines)
  - Trigger: Push to main/develop with path filters
  - Path Filters: apps/funnel/**, packages/**
  - Jobs: deploy-dev, deploy-prod
  - Actions: Build, Deploy to Railway

- **deploy-docs.yml** (74 lines)
  - Trigger: Push to main/develop with path filters
  - Path Filters: apps/docs/**, packages/**
  - Jobs: deploy-dev, deploy-prod
  - Actions: Build, Deploy to Railway

### 2. Railway Configuration Files

- **railway.dev.json** (65 lines)
  - Project: anplexa-dev
  - Services: API, Companions, Funnel, Docs
  - Databases: PostgreSQL, Redis
  - Environment Variables: Development-specific (NODE_ENV=development, localhost URLs)

- **railway.prod.json** (70 lines)
  - Project: anplexa-prod
  - Services: API, Companions, Funnel, Docs (with replicas: 2)
  - Databases: PostgreSQL, Redis
  - Environment Variables: Production-specific (NODE_ENV=production, production URLs, replicas)

### 3. Documentation Files

- **RAILWAY_SETUP.md** (430 lines)
  - Complete step-by-step setup guide
  - Database configuration
  - Environment variables reference
  - GitHub Actions integration
  - Troubleshooting guide

- **RAILWAY_QUICKSTART.md** (134 lines)
  - Quick reference checklist
  - Phase-by-phase setup
  - Common commands
  - Workflows overview

---

## Architecture Overview

```
GitHub Repository (main/develop branches)
    ↓
GitHub Actions Workflows
    ├── Lint (all branches) → pnpm lint
    ├── Test (all branches) → pnpm test
    ├── Build (all branches) → pnpm build
    └── Deploy (main/develop) → Railway CLI
        ├── develop branch → Development Project
        │   ├── API Service (3000)
        │   ├── Companions Service (3001)
        │   ├── Funnel Service (3002)
        │   ├── Docs Service (3003)
        │   ├── PostgreSQL Database
        │   └── Redis Database
        └── main branch → Production Project
            ├── API Service (3000) × 2 replicas
            ├── Companions Service (3001) × 2 replicas
            ├── Funnel Service (3002) × 2 replicas
            ├── Docs Service (3003) × 1 replica
            ├── PostgreSQL Database
            └── Redis Database
```

---

## Key Features Implemented

### 1. Environment-Aware Deployments
- Automatically deploys develop branch to dev environment
- Automatically deploys main branch to prod environment
- Separate Railway projects for isolation

### 2. Database Connectivity
- PostgreSQL configured in both environments
- Redis configured in both environments
- Environment variables injected: `${{postgres.DATABASE_URL}}`, `${{redis.REDIS_URL}}`

### 3. Turborepo Integration
- Build only affected apps: `pnpm build --filter=<app>`
- Test only affected apps: `pnpm test --filter=<app>`
- Enables faster CI/CD cycles

### 4. Path-Based Deployment Triggers
- API deploys only when: apps/api/** or packages/** changes
- Companions deploys only when: apps/companions/** or packages/** changes
- Funnel deploys only when: apps/funnel/** or packages/** changes
- Docs deploys only when: apps/docs/** or packages/** changes

### 5. Production Redundancy
- API service: 2 replicas
- Companions service: 2 replicas
- Funnel service: 2 replicas
- Docs service: 1 replica
- Automatic load balancing via Railway

### 6. Comprehensive Environment Variables
**Development:**
- NODE_ENV=development
- DATABASE_URL=${{postgres.DATABASE_URL}}
- REDIS_URL=${{redis.REDIS_URL}} (API only)
- NEXT_PUBLIC_API_URL=http://localhost:3000

**Production:**
- NODE_ENV=production
- DATABASE_URL=${{postgres.DATABASE_URL}}
- REDIS_URL=${{redis.REDIS_URL}} (API only)
- NEXT_PUBLIC_API_URL=https://api.anplexa.com
- LOG_LEVEL=info

---

## Setup Steps (Summary)

### Phase 1: GitHub Repository Configuration
```
✓ All workflow files created in .github/workflows/
✓ Configuration templates created (railway.dev.json, railway.prod.json)
```

### Phase 2: Railway Account Setup (Manual)
1. Create Railway dev project
2. Create Railway prod project
3. Generate Railway API token

### Phase 3: GitHub Secrets Configuration (Manual)
```
RAILWAY_TOKEN = <your-railway-api-token>
RAILWAY_DEV_PROJECT_ID = <development-project-id>
RAILWAY_PROD_PROJECT_ID = <production-project-id>
```

### Phase 4: Railway Project Configuration (Manual)
1. Add PostgreSQL database to each project
2. Add Redis database to each project
3. Add application services (api, companions, funnel, docs)
4. Configure environment variables per service
5. Set build and start commands

---

## Environment Variables by Service

### API Service
**Development:**
```
NODE_ENV=development
PORT=3000
DATABASE_URL=${{postgres.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
```

**Production:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{postgres.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
LOG_LEVEL=info
```

### Companions Service
**Development:**
```
NODE_ENV=development
PORT=3001
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Production:**
```
NODE_ENV=production
PORT=3001
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=https://api.anplexa.com
```

### Funnel Service
**Development:**
```
NODE_ENV=development
PORT=3002
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Production:**
```
NODE_ENV=production
PORT=3002
DATABASE_URL=${{postgres.DATABASE_URL}}
NEXT_PUBLIC_API_URL=https://api.anplexa.com
```

### Docs Service
**Development:**
```
NODE_ENV=development
PORT=3003
```

**Production:**
```
NODE_ENV=production
PORT=3003
```

---

## Build and Start Commands

All services use the same pattern:

**Build Command:**
```bash
pnpm install --frozen-lockfile && pnpm build --filter=<service>
```

**Start Command:**
```bash
pnpm start --filter=<service>
```

Example for API:
```bash
# Build
pnpm install --frozen-lockfile && pnpm build --filter=api

# Start
pnpm start --filter=api
```

---

## Deployment Flow

### Development Deployment (develop branch)
```
Push to develop
    ↓
GitHub Actions: Lint → Test → Build
    ↓
All checks pass
    ↓
Deploy to Railway Dev Project
    ↓
Services start with development environment variables
    ↓
Connected to development PostgreSQL and Redis
```

### Production Deployment (main branch)
```
Push to main
    ↓
GitHub Actions: Lint → Test → Build
    ↓
All checks pass
    ↓
Deploy to Railway Prod Project
    ↓
Services start with production environment variables
    ↓
Connected to production PostgreSQL and Redis
    ↓
Services run with 2 replicas (API, Companions, Funnel)
```

---

## File Locations (Absolute Paths)

### Workflows
```
/home/billyrichards/bbrdev1/anplexa/.github/workflows/
├── lint.yml
├── test.yml
├── build.yml
├── deploy-api.yml
├── deploy-companions.yml
├── deploy-funnel.yml
└── deploy-docs.yml
```

### Configuration
```
/home/billyrichards/bbrdev1/anplexa/
├── railway.dev.json
├── railway.prod.json
├── RAILWAY_SETUP.md
├── RAILWAY_QUICKSTART.md
└── RAILWAY_DEPLOYMENT_SUMMARY.md (this file)
```

### CODEOWNERS
```
/home/billyrichards/bbrdev1/anplexa/.github/CODEOWNERS
```

---

## Next Steps

### Immediate (Required)
1. Create Railway development project and note Project ID
2. Create Railway production project and note Project ID
3. Generate Railway API token in account settings
4. Add three secrets to GitHub repository:
   - RAILWAY_TOKEN
   - RAILWAY_DEV_PROJECT_ID
   - RAILWAY_PROD_PROJECT_ID

### Short-term (Days 1-2)
5. Add PostgreSQL database to both projects
6. Add Redis database to both projects
7. Add application services to both projects
8. Configure environment variables per service
9. Set build and start commands

### Testing (Days 3-5)
10. Create test commit on develop branch
11. Monitor GitHub Actions workflow execution
12. Verify services start in Railway dashboard
13. Test database connectivity
14. Verify environment variables are loaded

### Production Readiness (Days 5-7)
15. Test main branch deployments
16. Configure custom domains (if needed)
17. Set up monitoring and alerts
18. Document any custom environment variables
19. Create backup strategy for databases
20. Set up team access and permissions

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Deployment fails | Check RAILWAY_TOKEN validity, verify project IDs match |
| Build command fails | Test locally: `pnpm build --filter=<app>` |
| Services not starting | Check start command, verify environment variables are set |
| Database connection errors | Verify DATABASE_URL format, check database is running |
| Environment variables not loading | Check syntax: `${{postgres.DATABASE_URL}}` |
| Port conflicts | Ensure each service has unique port (3000, 3001, 3002, 3003) |

---

## Support Resources

- Railway Documentation: https://docs.railway.app
- Railway CLI Reference: https://docs.railway.app/reference/cli-api
- GitHub Actions Documentation: https://docs.github.com/en/actions
- pnpm Documentation: https://pnpm.io

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Workflow files created | 7 |
| CI/CD workflows (universal) | 3 |
| Deployment workflows | 4 |
| Configuration files | 2 |
| Documentation files | 3 |
| Services per environment | 4 |
| Databases per environment | 2 |
| Total lines of workflows | 366 |
| Total lines of configuration | 135 |
| Total lines of documentation | 564 |

---

## Completion Status

✅ All GitHub Actions workflows created and configured
✅ Railway configuration templates created
✅ Environment variable mapping complete
✅ Build and start commands configured
✅ Path-based deployment filters implemented
✅ Dev/Prod environment separation configured
✅ Database connection variables included
✅ Comprehensive documentation provided

**Status: Ready for Manual Railway Configuration and Testing**

The infrastructure is now ready for you to:
1. Complete the manual Railway project setup
2. Configure GitHub secrets
3. Test deployments to development
4. Validate production deployments
