# Railway Setup - Quick Start Checklist

## Phase 1: Initial Setup (15 minutes)

- [ ] Create Railway development project
- [ ] Create Railway production project
- [ ] Note down both Project IDs
- [ ] Create Railway API token in account settings
- [ ] Add `RAILWAY_TOKEN` to GitHub Secrets
- [ ] Add `RAILWAY_DEV_PROJECT_ID` to GitHub Secrets
- [ ] Add `RAILWAY_PROD_PROJECT_ID` to GitHub Secrets

## Phase 2: Development Project Setup (15 minutes)

```bash
railway link --project <ANPLEXA_DEV_PROJECT_ID>

# Add databases
railway add --service postgres
railway add --service redis

# Add application services
railway add --service api --source apps/api
railway add --service companions --source apps/companions
railway add --service funnel --source apps/funnel
railway add --service docs --source apps/docs
```

## Phase 3: Production Project Setup (15 minutes)

Repeat Phase 2 with `ANPLEXA_PROD_PROJECT_ID`

## Phase 4: Environment Variables (20 minutes)

For each service, set variables:

**Development API:**
```bash
railway link --project <ANPLEXA_DEV_PROJECT_ID>
railway variables --service api set NODE_ENV=development
railway variables --service api set PORT=3000
railway variables --service api set DATABASE_URL='${{postgres.DATABASE_URL}}'
railway variables --service api set REDIS_URL='${{redis.REDIS_URL}}'
```

**Production API:**
```bash
railway link --project <ANPLEXA_PROD_PROJECT_ID>
railway variables --service api set NODE_ENV=production
railway variables --service api set PORT=3000
railway variables --service api set DATABASE_URL='${{postgres.DATABASE_URL}}'
railway variables --service api set REDIS_URL='${{redis.REDIS_URL}}'
railway variables --service api set LOG_LEVEL=info
```

Repeat for companions, funnel, and docs services.

## Phase 5: Build & Start Commands (10 minutes)

In Railway Dashboard, for each service set:

**Build Command:**
```bash
pnpm install --frozen-lockfile && pnpm build --filter=<service>
```

**Start Command:**
```bash
pnpm start --filter=<service>
```

## Phase 6: Test Deployment (5 minutes)

1. Create a test commit on `develop` branch
2. Push to GitHub
3. Monitor Actions workflow
4. Check Railway dashboard for running services

## Quick Commands Reference

```bash
# Check deployment status
railway link --project <PROJECT_ID>
railway ps

# View logs
railway logs --service api

# Check variables
railway variables

# Manual deploy
railway up --service api

# Run commands with Railway env
railway run npm start
```

## GitHub Actions Workflows

| Workflow | Trigger | Target |
|----------|---------|--------|
| lint.yml | Any push/PR | - |
| test.yml | Any push/PR | - |
| build.yml | Any push/PR | - |
| deploy-api.yml | develop branch | Dev Railway |
| deploy-api.yml | main branch | Prod Railway |
| deploy-companions.yml | develop branch | Dev Railway |
| deploy-companions.yml | main branch | Prod Railway |
| deploy-funnel.yml | develop branch | Dev Railway |
| deploy-funnel.yml | main branch | Prod Railway |
| deploy-docs.yml | develop branch | Dev Railway |
| deploy-docs.yml | main branch | Prod Railway |

## Troubleshooting

**Deployment stuck?**
- Check RAILWAY_TOKEN is valid
- Verify project IDs match your projects
- Check GitHub Actions logs

**Build failing?**
- Test build locally: `pnpm build --filter=<service>`
- Verify pnpm cache is working
- Check Node.js version is 20+

**Environment variables not loading?**
- Verify syntax: `${{postgres.DATABASE_URL}}`
- Ensure variables are set on correct service
- Use `railway variables` to confirm

## Support

See `RAILWAY_SETUP.md` for detailed instructions and troubleshooting.
