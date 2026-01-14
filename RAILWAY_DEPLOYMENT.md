# Railway Deployment Guide for Anplexa Monorepo

This guide provides step-by-step instructions for deploying the Anplexa monorepo to Railway, including both development and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Project Setup](#railway-project-setup)
3. [Service Configuration](#service-configuration)
4. [Environment Variables](#environment-variables)
5. [GitHub Actions Setup](#github-actions-setup)
6. [Manual Deployment](#manual-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Prerequisites

Before you begin, ensure you have:

- A Railway account (sign up at https://railway.app)
- Railway CLI installed globally
- Node.js 18+ and pnpm 8+ installed
- GitHub repository with proper access
- Required API keys (Stripe, Ollama, Resend, etc.)

### Installing Railway CLI

```bash
npm install -g @railway/cli
```

### Authenticating with Railway

Interactive login (with browser):
```bash
railway login
```

Browserless login (for SSH/remote sessions):
```bash
railway login --browserless
```

Verify authentication:
```bash
railway whoami
```

## Railway Project Setup

### 1. Create Railway Projects

You'll need two Railway projects: one for development and one for production.

#### Development Project

```bash
# Create a new project
railway init

# Or link to an existing project
railway link [project-id]

# Create development environment
railway environment create development
```

#### Production Project

```bash
# Create a second project for production
railway init

# Create production environment
railway environment create production
```

### 2. Note Your Project IDs

After creating projects, note your project IDs:

```bash
railway status
```

You'll need these IDs for:
- `RAILWAY_DEV_PROJECT_ID`
- `RAILWAY_PROD_PROJECT_ID`

### 3. Create Services in Railway Dashboard

Go to your Railway dashboard and create the following services for each project:

1. **api** - Express API service
2. **companions** - Next.js companions app
3. **funnel** - Vite React funnel app
4. **docs** - Docusaurus documentation
5. **postgres** - PostgreSQL database (from Railway marketplace)
6. **redis** - Redis cache (from Railway marketplace)

## Service Configuration

Each service has a `railway.json` configuration file in its directory:

- `/apps/api/railway.json` - API service configuration
- `/apps/companions/railway.json` - Companions app configuration
- `/apps/funnel/railway.json` - Funnel app configuration
- `/apps/docs/railway.json` - Docs configuration

### Service Structure

Each service configuration includes:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "...",
    "watchPatterns": ["..."]
  },
  "deploy": {
    "startCommand": "...",
    "healthcheckPath": "/",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Environment Variables

### API Service Environment Variables

Set these variables in Railway dashboard for the API service:

**Development:**
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=${{postgres.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
JWT_SECRET=your-dev-jwt-secret-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
OLLAMA_BASE_URL=your-ollama-url
OLLAMA_API_KEY=your-ollama-api-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@anplexa.com
CORS_ORIGIN=https://companions-dev.railway.app,https://funnel-dev.railway.app
```

**Production:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{postgres.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
OLLAMA_BASE_URL=your-ollama-url
OLLAMA_API_KEY=your-ollama-api-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@anplexa.com
CORS_ORIGIN=https://companions.anplexa.com,https://funnel.anplexa.com
LOG_LEVEL=info
```

### Companions Service Environment Variables

**Development:**
```bash
NODE_ENV=development
PORT=3001
NEXT_PUBLIC_API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

**Production:**
```bash
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://api.anplexa.com
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
```

### Funnel Service Environment Variables

**Development:**
```bash
NODE_ENV=development
PORT=3002
VITE_API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Production:**
```bash
NODE_ENV=production
PORT=3002
VITE_API_URL=https://api.anplexa.com
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Docs Service Environment Variables

**Development & Production:**
```bash
NODE_ENV=development  # or production
PORT=3003
```

### Database Services

**PostgreSQL:**
- Railway automatically provides `DATABASE_URL`
- Reference it in other services with `${{postgres.DATABASE_URL}}`

**Redis:**
- Railway automatically provides `REDIS_URL`
- Reference it in other services with `${{redis.REDIS_URL}}`

## GitHub Actions Setup

### 1. Generate Railway Tokens

For CI/CD, you need Railway project tokens:

```bash
# Link to your project
railway link [project-id]

# Generate a project token (use project scope for security)
# Go to Railway dashboard → Project Settings → Tokens → Create Token
```

Create separate tokens for:
- Development deployments
- Production deployments

### 2. Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, then add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `RAILWAY_TOKEN` | Railway API token for deployments | `your-railway-token` |
| `RAILWAY_DEV_PROJECT_ID` | Development project ID | `abc123def456` |
| `RAILWAY_PROD_PROJECT_ID` | Production project ID | `xyz789ghi012` |

### 3. Deployment Workflows

Two GitHub Actions workflows are configured:

**Development Deployment** (`.github/workflows/deploy-dev.yml`):
- Triggers on push to `develop` branch
- Deploys all services to development environment
- Can be manually triggered via workflow_dispatch

**Production Deployment** (`.github/workflows/deploy-prod.yml`):
- Triggers on push to `main` branch
- Runs full test suite before deployment
- Deploys all services to production environment
- Can be manually triggered via workflow_dispatch

### 4. Manual Workflow Trigger

You can manually trigger deployments from GitHub:
1. Go to Actions tab in your repository
2. Select the workflow (Deploy to Development or Production)
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Manual Deployment

### Deploy All Services

**Development:**
```bash
# Link to development project
railway link $RAILWAY_DEV_PROJECT_ID

# Switch to development environment
railway environment development

# Deploy all services
cd apps/api && railway up --service api --detach
cd ../companions && railway up --service companions --detach
cd ../funnel && railway up --service funnel --detach
cd ../docs && railway up --service docs --detach
```

**Production:**
```bash
# Link to production project
railway link $RAILWAY_PROD_PROJECT_ID

# Switch to production environment
railway environment production

# Run tests first
pnpm test

# Deploy all services
cd apps/api && railway up --service api --detach
cd ../companions && railway up --service companions --detach
cd ../funnel && railway up --service funnel --detach
cd ../docs && railway up --service docs --detach
```

### Deploy Individual Service

```bash
# Navigate to service directory
cd apps/api

# Deploy to specific environment
railway up --service api --environment development

# Or for production
railway up --service api --environment production
```

### Check Deployment Status

```bash
# Check overall project status
railway status

# View logs for a specific service
railway logs --service api

# View build logs
railway logs --service api --build

# View deployment logs
railway logs --service api --deployment

# Follow logs in real-time
railway logs --service api --follow
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Problem:** Build fails with dependency errors

**Solution:**
```bash
# Ensure pnpm lockfile is up to date
pnpm install

# Commit the updated lockfile
git add pnpm-lock.yaml
git commit -m "Update lockfile"

# Try deploying again
railway up
```

#### 2. Service Not Starting

**Problem:** Service builds but doesn't start

**Solution:**
- Check logs: `railway logs --service [service-name]`
- Verify start command in `railway.json`
- Check environment variables are set correctly
- Ensure PORT is set and service listens on `0.0.0.0:$PORT`

#### 3. Database Connection Issues

**Problem:** Can't connect to PostgreSQL

**Solution:**
```bash
# Verify DATABASE_URL is set
railway variables --service api

# Check database is running
railway status

# Test connection
railway connect postgres
```

#### 4. Redis Connection Issues

**Problem:** Can't connect to Redis

**Solution:**
```bash
# Verify REDIS_URL is set
railway variables --service api

# Check Redis is running
railway status

# Test connection
railway connect redis
```

#### 5. CORS Errors

**Problem:** Frontend can't connect to API

**Solution:**
- Verify `CORS_ORIGIN` environment variable includes frontend URLs
- Check API logs for CORS-related errors
- Ensure domains are correctly formatted (with https://)

#### 6. Build Command Not Found

**Problem:** Railway can't find build commands

**Solution:**
- Ensure monorepo root `railway.json` includes pnpm setup
- Use full paths in build commands: `cd ../.. && pnpm build --filter=...`
- Verify `watchPatterns` include all necessary directories

### Debugging Tips

1. **Check service logs:**
   ```bash
   railway logs --service [service-name]
   ```

2. **Verify environment variables:**
   ```bash
   railway variables --service [service-name]
   ```

3. **Test locally with Railway environment:**
   ```bash
   railway run pnpm dev --filter=[service-name]
   ```

4. **Check service health:**
   ```bash
   railway status
   ```

5. **View deployment history:**
   ```bash
   railway logs --service [service-name] --deployment
   ```

### Getting Help

If you encounter issues not covered here:

1. Check Railway documentation: https://docs.railway.app
2. Railway Discord community: https://discord.gg/railway
3. Review Railway status page: https://status.railway.app
4. Contact Railway support through dashboard

## Best Practices

### 1. Environment Management

- Always use separate Railway projects for development and production
- Use Railway's reference variables (`${{service.VAR_NAME}}`) for inter-service communication
- Store sensitive values as Railway variables, never commit them

### 2. Deployment Strategy

- Deploy to development first and test thoroughly
- Run full test suite before production deployments
- Use GitHub Actions for consistent, automated deployments
- Monitor deployment logs during rollout

### 3. Database Management

- Use Railway's built-in PostgreSQL for ease of management
- Enable automatic backups in production
- Test database migrations in development first
- Keep connection pooling settings appropriate for your usage

### 4. Monitoring and Logging

- Enable Railway metrics for all services
- Set up log retention policies
- Monitor resource usage and scale as needed
- Use structured logging in your applications

### 5. Security

- Rotate Railway tokens regularly
- Use project-scoped tokens for CI/CD (not account-scoped)
- Enable Railway's built-in DDoS protection
- Keep dependencies updated

### 6. Performance Optimization

- Use Railway's built-in CDN for static assets
- Enable horizontal scaling for API and web services in production
- Configure appropriate health check intervals
- Use Redis for caching and session management

### 7. Cost Management

- Monitor usage in Railway dashboard
- Use development environment for testing (lower resources)
- Configure appropriate replica counts (1 for dev, 2+ for prod)
- Set resource limits for services

## Railway Configuration Files

The monorepo includes the following Railway configuration files:

```
anplexa/
├── railway.dev.json              # Root dev config
├── railway.prod.json             # Root prod config
├── apps/
│   ├── api/railway.json         # API service config
│   ├── companions/railway.json  # Companions service config
│   ├── funnel/railway.json      # Funnel service config
│   └── docs/railway.json        # Docs service config
└── .github/
    └── workflows/
        ├── deploy-dev.yml       # Dev deployment workflow
        └── deploy-prod.yml      # Prod deployment workflow
```

## Service URLs

After deployment, your services will be available at:

**Development:**
- API: `https://api-dev.railway.app` or custom domain
- Companions: `https://companions-dev.railway.app`
- Funnel: `https://funnel-dev.railway.app`
- Docs: `https://docs-dev.railway.app`

**Production:**
- API: `https://api.anplexa.com`
- Companions: `https://companions.anplexa.com`
- Funnel: `https://funnel.anplexa.com`
- Docs: `https://docs.anplexa.com`

## Custom Domains

To configure custom domains:

1. Go to Railway dashboard → Project → Service → Settings
2. Click "Generate Domain" for Railway subdomain
3. Or add custom domain:
   - Click "Custom Domain"
   - Enter your domain
   - Add the provided DNS records to your domain provider
   - Wait for DNS propagation (can take up to 48 hours)
4. Railway automatically provisions SSL certificates

## Database Migrations

When deploying with database schema changes:

```bash
# Run migrations manually before deployment
railway run --service api pnpm db:migrate

# Or include in deployment workflow
# Add to deploy step in GitHub Actions:
- name: Run database migrations
  run: railway run --service api pnpm db:migrate
```

## Rollback Procedure

If a deployment fails or causes issues:

```bash
# View deployment history
railway logs --service [service-name] --deployment

# Rollback to previous deployment via Railway dashboard
# Dashboard → Service → Deployments → Select previous → Rollback

# Or redeploy a specific commit via CLI
railway up --service [service-name] --commit [commit-hash]
```

## Monitoring and Alerts

Set up monitoring:

1. Enable Railway metrics in dashboard
2. Configure alert thresholds for:
   - CPU usage > 80%
   - Memory usage > 90%
   - Error rate > 5%
   - Response time > 2s
3. Add notification webhooks for Slack/Discord/Email

## Support and Resources

- Railway Documentation: https://docs.railway.app
- Railway Blog: https://blog.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
- Railway Changelog: https://railway.app/changelog

---

**Last Updated:** 2026-01-14

**Maintained By:** Anplexa DevOps Team
