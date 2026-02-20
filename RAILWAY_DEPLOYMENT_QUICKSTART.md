# Railway Deployment Quick Start Guide

**Projects Created:**
- **Development:** https://railway.com/project/36380b1b-232c-4c2a-a198-c886fd7b190d
- **Production:** https://railway.com/project/19122978-7d29-44ae-8b88-a9f20643ab7e

---

## Step 1: Set Up Development Project (15 minutes)

### 1.1 Add Databases via Dashboard

Open the dev project: https://railway.com/project/36380b1b-232c-4c2a-a198-c886fd7b190d

Click **"+ New"** → **"Database"** → Select **PostgreSQL**
- Railway will automatically provision and configure the database
- Note: `DATABASE_URL` variable will be auto-generated

Click **"+ New"** → **"Database"** → Select **Redis**
- Railway will automatically provision Redis
- Note: `REDIS_URL` variable will be auto-generated

### 1.2 Create Application Services

Click **"+ New"** → **"Empty Service"** (Do this 4 times)

**Service 1: API**
- Name: `api`
- Root Directory: `/apps/api`
- Build Command: `cd ../.. && pnpm install && pnpm build --filter=@anplexa/api`
- Start Command: `pnpm --filter=@anplexa/api start`
- Health Check Path: `/api/health`

**Service 2: Companions**
- Name: `companions`
- Root Directory: `/apps/companions`
- Build Command: `cd ../.. && pnpm install && pnpm build --filter=@anplexa/companions`
- Start Command: `pnpm --filter=@anplexa/companions start`
- Health Check Path: `/`

**Service 3: Funnel**
- Name: `funnel`
- Root Directory: `/apps/funnel`
- Build Command: `cd ../.. && pnpm install && pnpm build --filter=@anplexa/funnel`
- Start Command: `pnpm --filter=@anplexa/funnel preview`
- Health Check Path: `/`

**Service 4: Docs**
- Name: `docs`
- Root Directory: `/apps/docs`
- Build Command: `cd ../.. && pnpm install && pnpm build --filter=@anplexa/docs`
- Start Command: `pnpm --filter=@anplexa/docs serve`
- Health Check Path: `/`

### 1.3 Configure Environment Variables

**For API Service (Click "Variables" tab):**

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Configuration
JWT_SECRET=<GENERATE_SECURE_SECRET_HERE>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Ollama Configuration (Your AI service)
OLLAMA_BASE_URL=<YOUR_OLLAMA_URL>
OLLAMA_API_KEY=<YOUR_OLLAMA_API_KEY>

# Stripe Configuration (Test mode)
STRIPE_SECRET_KEY=<YOUR_STRIPE_TEST_SECRET_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>
STRIPE_PRICE_ID_BASIC=<YOUR_PRICE_ID>
STRIPE_PRICE_ID_PRO=<YOUR_PRICE_ID>
STRIPE_PRICE_ID_ENTERPRISE=<YOUR_PRICE_ID>

# Email Configuration
RESEND_API_KEY=<YOUR_RESEND_API_KEY>
RESEND_FROM_EMAIL=noreply@anplexa.com

# CORS (Will update after services are deployed)
CORS_ORIGIN=https://*.railway.app
```

**For Companions Service:**

```bash
NODE_ENV=development
PORT=3001
NEXT_PUBLIC_API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=<YOUR_STRIPE_TEST_PUBLIC_KEY>
```

**For Funnel Service:**

```bash
NODE_ENV=development
PORT=3002
VITE_API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}
VITE_STRIPE_PUBLIC_KEY=<YOUR_STRIPE_TEST_PUBLIC_KEY>
```

**For Docs Service:**

```bash
NODE_ENV=development
PORT=3003
```

### 1.4 Connect to GitHub Repository

For each service:
1. Click on the service
2. Go to **"Settings"** → **"Source"**
3. Click **"Connect Repo"**
4. Select your GitHub repository: `billyrichards/anplexa`
5. Set the **Root Directory** to the appropriate path:
   - API: `/apps/api`
   - Companions: `/apps/companions`
   - Funnel: `/apps/funnel`
   - Docs: `/apps/docs`
6. Set **Branch** to `develop`

### 1.5 Deploy to Development

Once configured, Railway will automatically deploy. You can also trigger manual deployments:
1. Click on each service
2. Click **"Deploy"** button
3. Monitor logs in the **"Deployments"** tab

---

## Step 2: Set Up Production Project (15 minutes)

Repeat **Step 1** for the production project: https://railway.com/project/19122978-7d29-44ae-8b88-a9f20643ab7e

**Key Differences for Production:**

1. **Branch:** Use `main` instead of `develop`
2. **Replicas:** Set 2 replicas for API, Companions, Funnel (for high availability)
3. **Environment Variables:** Use production Stripe keys (`sk_live_...`, `pk_live_...`)
4. **NODE_ENV:** Set to `production`

**Production Environment Variables (API):**

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

JWT_SECRET=<DIFFERENT_PRODUCTION_SECRET>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

OLLAMA_BASE_URL=<YOUR_OLLAMA_URL>
OLLAMA_API_KEY=<YOUR_OLLAMA_API_KEY>

# Stripe PRODUCTION keys
STRIPE_SECRET_KEY=<YOUR_STRIPE_LIVE_SECRET_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_LIVE_WEBHOOK_SECRET>
STRIPE_PRICE_ID_BASIC=<YOUR_PROD_PRICE_ID>
STRIPE_PRICE_ID_PRO=<YOUR_PROD_PRICE_ID>
STRIPE_PRICE_ID_ENTERPRISE=<YOUR_PROD_PRICE_ID>

RESEND_API_KEY=<YOUR_RESEND_API_KEY>
RESEND_FROM_EMAIL=noreply@anplexa.com

CORS_ORIGIN=https://*.railway.app,https://anplexa.com
LOG_LEVEL=info
```

---

## Step 3: Verify Deployments (10 minutes)

### Development URLs (After deployment completes):

Check your Railway dashboard for the generated URLs:
- API: `https://api-dev-<random>.railway.app`
- Companions: `https://companions-dev-<random>.railway.app`
- Funnel: `https://funnel-dev-<random>.railway.app`
- Docs: `https://docs-dev-<random>.railway.app`

### Test Endpoints:

```bash
# Test API health
curl https://<api-dev-url>/api/health

# Test Companions app (in browser)
open https://<companions-dev-url>

# Test Funnel app (in browser)
open https://<funnel-dev-url>

# Test Docs (in browser)
open https://<docs-dev-url>
```

---

## Step 4: Configure Custom Domains (Optional)

Once verified, you can add custom domains:

**Development:**
- `api-dev.anplexa.com` → API service
- `companions-dev.anplexa.com` → Companions service
- `funnel-dev.anplexa.com` → Funnel service
- `docs-dev.anplexa.com` → Docs service

**Production:**
- `api.anplexa.com` → API service
- `app.anplexa.com` → Companions service
- `funnel.anplexa.com` → Funnel service
- `docs.anplexa.com` → Docs service

For each custom domain:
1. Go to service → **Settings** → **Networking** → **Custom Domain**
2. Enter your domain
3. Add the CNAME record to your DNS provider:
   - Type: `CNAME`
   - Name: `api` (or subdomain)
   - Value: `<provided-by-railway>.railway.app`
4. Wait for DNS propagation (5-60 minutes)
5. Railway will auto-provision SSL certificates

---

## Step 5: Set Up GitHub Actions (Automated Deployments)

### 5.1 Generate Railway Tokens

1. Go to **Account Settings** → **Tokens**
2. Create a new token with **Project** scope
3. Copy the token

### 5.2 Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:
- `RAILWAY_TOKEN` = Your Railway API token
- `RAILWAY_DEV_PROJECT_ID` = `36380b1b-232c-4c2a-a198-c886fd7b190d`
- `RAILWAY_PROD_PROJECT_ID` = `19122978-7d29-44ae-8b88-a9f20643ab7e`

### 5.3 GitHub Actions Workflows

Your repository already has these workflows configured:
- `.github/workflows/deploy-dev.yml` - Deploys on push to `develop`
- `.github/workflows/deploy-prod.yml` - Deploys on push to `main`

**Test automatic deployment:**

```bash
# Make a small change
echo "# Deployment test" >> README.md
git add README.md
git commit -m "test: Trigger Railway dev deployment"
git push origin develop

# Monitor in GitHub Actions tab
```

---

## Troubleshooting

### Build Failures

**Problem:** Build fails with "command not found"

**Solution:** Ensure build commands use full workspace paths:
```bash
cd ../.. && pnpm install && pnpm build --filter=@anplexa/api
```

### Database Connection Errors

**Problem:** Can't connect to PostgreSQL

**Solution:**
1. Check `DATABASE_URL` is set correctly: `${{Postgres.DATABASE_URL}}`
2. Verify PostgreSQL service is running (green indicator in dashboard)
3. Check logs: Click service → **Deployments** → View logs

### CORS Errors

**Problem:** Frontend can't connect to API

**Solution:** Update API's `CORS_ORIGIN` variable to include frontend URLs:
```bash
CORS_ORIGIN=https://companions-dev.railway.app,https://funnel-dev.railway.app
```

### Service Won't Start

**Problem:** Service builds but doesn't start

**Solution:**
1. Check start command is correct
2. Ensure `PORT` environment variable is set
3. Verify service listens on `0.0.0.0:$PORT` (not `localhost`)
4. Check logs for startup errors

---

## Next Steps

1. ✅ Open development project: https://railway.com/project/36380b1b-232c-4c2a-a198-c886fd7b190d
2. ✅ Add PostgreSQL and Redis databases
3. ✅ Create 4 services (api, companions, funnel, docs)
4. ✅ Configure environment variables for each service
5. ✅ Connect services to GitHub repository
6. ✅ Deploy and test
7. ✅ Repeat for production project
8. ✅ Configure custom domains (optional)
9. ✅ Set up GitHub Actions for automated deployments

**Estimated Time:** 45-60 minutes for complete setup

**Status:** Ready to configure in Railway Dashboard 🚀
