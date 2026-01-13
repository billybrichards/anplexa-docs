# Anplexa Railway Deployment - Complete Index

## Quick Navigation

Start here based on your needs:

### I need a quick overview
→ Read **RAILWAY_DEPLOYMENT_SUMMARY.md** (5-10 minutes)

### I need to set up Railway step-by-step
→ Read **RAILWAY_SETUP.md** (15-30 minutes)

### I need a quick checklist
→ Read **RAILWAY_QUICKSTART.md** (5 minutes)

### I need to understand the workflows
→ Review files in **`.github/workflows/`**:
- lint.yml
- test.yml
- build.yml
- deploy-api.yml
- deploy-companions.yml
- deploy-funnel.yml
- deploy-docs.yml

### I need to customize the configuration
→ Edit configuration templates:
- **railway.dev.json** - Development environment
- **railway.prod.json** - Production environment

---

## Document Overview

### RAILWAY_DEPLOYMENT_SUMMARY.md
- **Purpose**: Complete project overview and architecture
- **Content**:
  - Architecture diagram
  - Features implemented
  - Environment variables by service
  - Build and start commands
  - Deployment flow visualization
  - File locations
  - Next steps and timeline
  - Troubleshooting guide

### RAILWAY_SETUP.md
- **Purpose**: Detailed step-by-step setup instructions
- **Content**:
  - Prerequisites and installation
  - Project creation steps
  - Database configuration
  - GitHub secrets setup
  - Environment variable configuration
  - Build and start command setup
  - GitHub Actions workflow explanation
  - Testing procedures
  - CI/CD flow diagram
  - Useful Railway CLI commands
  - Next steps and support resources

### RAILWAY_QUICKSTART.md
- **Purpose**: Quick reference with checklists
- **Content**:
  - Phase-by-phase setup checklist
  - Quick command reference
  - Workflow overview table
  - Troubleshooting quick reference

---

## Infrastructure Files

### GitHub Actions Workflows

| File | Purpose | Trigger | Action |
|------|---------|---------|--------|
| lint.yml | Code quality | All branches | pnpm lint |
| test.yml | Unit tests | All branches | pnpm test |
| build.yml | Build validation | All branches | pnpm build |
| deploy-api.yml | API deployment | main/develop | Railway deploy |
| deploy-companions.yml | Companions deployment | main/develop | Railway deploy |
| deploy-funnel.yml | Funnel deployment | main/develop | Railway deploy |
| deploy-docs.yml | Docs deployment | main/develop | Railway deploy |

### Railway Configuration Files

| File | Purpose | Environment | Replicas |
|------|---------|-------------|----------|
| railway.dev.json | Development config | develop branch | 1x all |
| railway.prod.json | Production config | main branch | 2x API/Companions/Funnel, 1x Docs |

### Supporting Files

| File | Purpose |
|------|---------|
| .github/CODEOWNERS | Team ownership mapping |

---

## Setup Timeline

### Day 1 (1-2 hours)
1. Create Railway development project
2. Create Railway production project
3. Generate Railway API token
4. Add GitHub secrets (RAILWAY_TOKEN, PROJECT_IDs)

### Day 2 (2-3 hours)
5. Add PostgreSQL and Redis to both projects
6. Add application services to both projects
7. Configure environment variables
8. Configure build and start commands

### Day 3 (1-2 hours)
9. Test deployment on develop branch
10. Monitor GitHub Actions
11. Verify services in Railway dashboard
12. Test database connectivity

### Day 4 (1 hour)
13. Test main branch deployment
14. Configure custom domains (optional)
15. Set up monitoring (optional)

---

## Services Deployed

### API Service
- **Port**: 3000
- **Build**: `pnpm install --frozen-lockfile && pnpm build --filter=api`
- **Start**: `pnpm start --filter=api`
- **Dev Env**: NODE_ENV=development, DATABASE_URL, REDIS_URL
- **Prod Env**: NODE_ENV=production, DATABASE_URL, REDIS_URL, LOG_LEVEL=info

### Companions Service
- **Port**: 3001
- **Build**: `pnpm install --frozen-lockfile && pnpm build --filter=companions`
- **Start**: `pnpm start --filter=companions`
- **Dev Env**: NODE_ENV=development, DATABASE_URL, NEXT_PUBLIC_API_URL=localhost
- **Prod Env**: NODE_ENV=production, DATABASE_URL, NEXT_PUBLIC_API_URL=production

### Funnel Service
- **Port**: 3002
- **Build**: `pnpm install --frozen-lockfile && pnpm build --filter=funnel`
- **Start**: `pnpm start --filter=funnel`
- **Dev Env**: NODE_ENV=development, DATABASE_URL, NEXT_PUBLIC_API_URL=localhost
- **Prod Env**: NODE_ENV=production, DATABASE_URL, NEXT_PUBLIC_API_URL=production

### Docs Service
- **Port**: 3003
- **Build**: `pnpm install --frozen-lockfile && pnpm build --filter=docs`
- **Start**: `pnpm start --filter=docs`
- **Dev Env**: NODE_ENV=development
- **Prod Env**: NODE_ENV=production

---

## Databases

### PostgreSQL
- **Location**: Both dev and prod environments
- **Accessible via**: DATABASE_URL environment variable
- **Auto-provisioned**: Yes

### Redis
- **Location**: Both dev and prod environments
- **Accessible via**: REDIS_URL environment variable
- **Auto-provisioned**: Yes

---

## Deployment Branches

### Development (develop branch)
- **Trigger**: Push to develop branch
- **Workflow**: lint → test → build → deploy to dev
- **Environment**: Development Railway project
- **Database**: Development PostgreSQL + Redis
- **Replicas**: 1 per service

### Production (main branch)
- **Trigger**: Push to main branch
- **Workflow**: lint → test → build → deploy to prod
- **Environment**: Production Railway project
- **Database**: Production PostgreSQL + Redis
- **Replicas**: 2x (API, Companions, Funnel), 1x (Docs)

---

## Essential Commands

### Railway Setup
```bash
# Initialize Railway CLI
railway link --project <PROJECT_ID>

# Add services
railway add --service postgres
railway add --service redis
railway add --service api --source apps/api

# View status
railway ps

# View logs
railway logs --service api

# Set variables
railway variables set NODE_ENV=development

# Deploy
railway up --service api
```

### Local Development
```bash
# Install dependencies
pnpm install

# Run linting
pnpm lint

# Run tests
pnpm test

# Build monorepo
pnpm build

# Build specific service
pnpm build --filter=api

# Start service
pnpm start --filter=api
```

---

## Troubleshooting Quick Links

**Deployment issues?** → See RAILWAY_SETUP.md Troubleshooting section
**Build failures?** → Check pnpm installation and Node.js version
**Environment variables?** → Verify Railway syntax: `${{postgres.DATABASE_URL}}`
**Database connection?** → Check DATABASE_URL format and service status

---

## GitHub Secrets Required

Before deployment, add these to GitHub repository settings:

1. **RAILWAY_TOKEN** - Your Railway API token
2. **RAILWAY_DEV_PROJECT_ID** - Development project ID
3. **RAILWAY_PROD_PROJECT_ID** - Production project ID

---

## File Locations

```
/home/billyrichards/bbrdev1/anplexa/
├── .github/
│   ├── CODEOWNERS
│   └── workflows/
│       ├── lint.yml
│       ├── test.yml
│       ├── build.yml
│       ├── deploy-api.yml
│       ├── deploy-companions.yml
│       ├── deploy-funnel.yml
│       └── deploy-docs.yml
├── railway.dev.json
├── railway.prod.json
├── RAILWAY_INDEX.md (this file)
├── RAILWAY_SETUP.md
├── RAILWAY_QUICKSTART.md
└── RAILWAY_DEPLOYMENT_SUMMARY.md
```

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway CLI**: https://docs.railway.app/reference/cli-api
- **GitHub Actions**: https://docs.github.com/en/actions
- **pnpm**: https://pnpm.io

---

## Status

✅ All infrastructure files created
✅ Workflows configured for dev/prod
✅ Database connections configured
✅ Environment variables mapped
✅ Documentation complete

**Ready for manual Railway project setup and testing.**

