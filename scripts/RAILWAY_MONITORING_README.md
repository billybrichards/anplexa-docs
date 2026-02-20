# Railway Deployment Monitoring Guide

## Overview

This guide provides instructions for monitoring your Anplexa Railway deployment using the provided monitoring script.

**Monitoring Script:** `scripts/monitor-railway.sh`

## Quick Start

```bash
# Show monitoring dashboard
./scripts/monitor-railway.sh

# Check project status
./scripts/monitor-railway.sh status

# Stream logs from API service
./scripts/monitor-railway.sh logs api

# Check health endpoints
./scripts/monitor-railway.sh health
```

---

## Installation & Setup

### Prerequisites

1. **Railway CLI** installed and authenticated:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Project Linked** to your local repository:
   ```bash
   railway link --project 36380b1b-232c-4c2a-a198-c886fd7b190d \
                --environment bdab3ee8-e57d-4c88-a12c-9f48368f07a9
   ```

3. **Script Permissions** set to executable:
   ```bash
   chmod +x scripts/monitor-railway.sh
   ```

---

## Available Commands

### Show Dashboard
```bash
./scripts/monitor-railway.sh
# or
./scripts/monitor-railway.sh monitor
```

Displays:
- Project name and environment
- List of all services
- Quick command reference

### Check Status
```bash
./scripts/monitor-railway.sh status
```

Shows:
- Current project and environment
- Service deployment status
- Last deployment information

### Stream Live Logs
```bash
./scripts/monitor-railway.sh logs <service-name>
```

**Examples:**
```bash
# Stream API logs
./scripts/monitor-railway.sh logs api

# Stream Companions logs
./scripts/monitor-railway.sh logs companions

# Stream Funnel logs
./scripts/monitor-railway.sh logs funnel

# Stream Docs logs
./scripts/monitor-railway.sh logs docs
```

**Note:** Press `Ctrl+C` to stop streaming

### View Recent Logs
```bash
./scripts/monitor-railway.sh view-logs <service-name> [number-of-lines]
```

**Examples:**
```bash
# View last 100 lines (default)
./scripts/monitor-railway.sh view-logs api

# View last 50 lines
./scripts/monitor-railway.sh view-logs api 50

# View last 200 lines
./scripts/monitor-railway.sh view-logs companions 200
```

### Check Health Endpoints
```bash
./scripts/monitor-railway.sh health
```

Shows instructions for checking health endpoints for all services.

**Health Endpoint Reference:**
- **API:** `/health` - Returns JSON with status, timestamp, version
- **Companions:** `/` - Returns HTTP 200 OK
- **Funnel:** `/` - Returns HTTP 200 OK
- **Docs:** `/` - Returns HTTP 200 OK

### View Environment Variables
```bash
./scripts/monitor-railway.sh vars <service-name>
```

**Examples:**
```bash
# View API environment variables
./scripts/monitor-railway.sh vars api

# View Companions environment variables
./scripts/monitor-railway.sh vars companions
```

### View Build Logs
```bash
./scripts/monitor-railway.sh build-logs <service-name>
```

Shows logs specifically from the build phase.

### View Deployment Logs
```bash
./scripts/monitor-railway.sh deploy-logs <service-name>
```

Shows logs specifically from the deployment phase.

### Deploy a Service
```bash
./scripts/monitor-railway.sh deploy <service-name>
```

**Examples:**
```bash
# Deploy API service
./scripts/monitor-railway.sh deploy api

# Deploy Companions service
./scripts/monitor-railway.sh deploy companions
```

**Note:** This will trigger a new deployment for the specified service.

### Show Help
```bash
./scripts/monitor-railway.sh help
```

Displays complete command reference with examples.

---

## Service Reference

| Service | Type | Port | Health Endpoint |
|---------|------|------|-----------------|
| **api** | Express.js API | 3000 | `/health` |
| **companions** | Next.js App | 3001 | `/` |
| **funnel** | Vite React SPA | 3002 | `/` |
| **docs** | Docusaurus | 3003 | `/` |

---

## Common Monitoring Workflows

### 1. Check Deployment Status After Push

```bash
# 1. Check overall status
./scripts/monitor-railway.sh status

# 2. Stream logs for the service you deployed
./scripts/monitor-railway.sh logs api

# 3. Once deployed, check health
curl https://[api-domain]/health
```

### 2. Debug a Failing Service

```bash
# 1. View recent logs to identify issue
./scripts/monitor-railway.sh view-logs api 200

# 2. Check build logs for build failures
./scripts/monitor-railway.sh build-logs api

# 3. Check deployment logs for runtime issues
./scripts/monitor-railway.sh deploy-logs api

# 4. Verify environment variables
./scripts/monitor-railway.sh vars api
```

### 3. Monitor All Services

```bash
# Open multiple terminal windows/panes and run:
./scripts/monitor-railway.sh logs api         # Terminal 1
./scripts/monitor-railway.sh logs companions  # Terminal 2
./scripts/monitor-railway.sh logs funnel      # Terminal 3
./scripts/monitor-railway.sh logs docs        # Terminal 4
```

### 4. Continuous Health Monitoring

```bash
# Use watch command to check health every 5 seconds
watch -n 5 'curl -s https://[api-domain]/health | jq .'

# Or check all services in a loop
while true; do
  echo "API Health:"
  curl -s https://[api-domain]/health | jq .
  echo ""
  sleep 10
done
```

---

## Advanced Monitoring

### Using Railway CLI Directly

The monitoring script wraps Railway CLI commands. You can also use Railway CLI directly:

```bash
# Get project status
railway status

# Stream logs with Railway CLI
railway logs --service api --follow

# View variables
railway variables --service api

# Deploy a service
cd apps/api
railway up --service api
```

### Using Railway Dashboard

Access the web dashboard at:
```
https://railway.com/project/36380b1b-232c-4c2a-a198-c886fd7b190d?environmentId=bdab3ee8-e57d-4c88-a12c-9f48368f07a9
```

The dashboard provides:
- Real-time metrics (CPU, Memory, Network)
- Deployment history
- Build and deployment logs
- Environment variable management
- Service configuration

---

## Health Check Examples

### API Health Check (Detailed)

The API service has a comprehensive health endpoint:

```bash
curl https://[api-domain]/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-14T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Other Services (Basic)

```bash
# Check HTTP status only
curl -I https://[companions-domain]/
curl -I https://[funnel-domain]/
curl -I https://[docs-domain]/
```

**Expected Response:** HTTP 200 OK

### Automated Health Checks

Create a simple health check script:

```bash
#!/bin/bash
# health-check.sh

API_URL="https://[api-domain]"
COMPANIONS_URL="https://[companions-domain]"
FUNNEL_URL="https://[funnel-domain]"
DOCS_URL="https://[docs-domain]"

echo "Checking API..."
curl -s "$API_URL/health" | jq .

echo "Checking Companions..."
curl -I "$COMPANIONS_URL" 2>&1 | grep "HTTP"

echo "Checking Funnel..."
curl -I "$FUNNEL_URL" 2>&1 | grep "HTTP"

echo "Checking Docs..."
curl -I "$DOCS_URL" 2>&1 | grep "HTTP"
```

---

## Troubleshooting

### Issue: "No Railway project linked"

**Solution:**
```bash
railway link --project 36380b1b-232c-4c2a-a198-c886fd7b190d \
             --environment bdab3ee8-e57d-4c88-a12c-9f48368f07a9
```

### Issue: "Railway CLI not found"

**Solution:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Verify installation
railway --version
```

### Issue: "Permission denied" when running script

**Solution:**
```bash
chmod +x scripts/monitor-railway.sh
```

### Issue: Service logs are empty

**Possible Causes:**
1. Service hasn't been deployed yet
2. Service name is incorrect
3. Service is in different environment

**Solution:**
```bash
# Check service exists
railway status

# Verify you're in correct environment
railway environment
```

### Issue: Health endpoint returns 404

**Possible Causes:**
1. Service URL is incorrect
2. Service hasn't finished deploying
3. Health endpoint not implemented

**Solution:**
```bash
# Get correct service URL from Railway status
railway status

# Check deployment status
./scripts/monitor-railway.sh status

# View logs to check for startup errors
./scripts/monitor-railway.sh logs api
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Monitor Deployment

on:
  push:
    branches: [main, develop]

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Link to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          railway link --project 36380b1b-232c-4c2a-a198-c886fd7b190d \
                       --environment bdab3ee8-e57d-4c88-a12c-9f48368f07a9

      - name: Check deployment status
        run: ./scripts/monitor-railway.sh status

      - name: Verify API health
        run: |
          sleep 30  # Wait for deployment
          curl -f https://[api-domain]/health || exit 1
```

---

## Monitoring Best Practices

1. **Regular Health Checks**
   - Poll health endpoints every 30-60 seconds
   - Alert on 3+ consecutive failures

2. **Log Monitoring**
   - Stream logs during deployments
   - Set up log aggregation for production
   - Monitor error rates

3. **Restart Tracking**
   - Railway restarts services on failure (max 10 retries)
   - Investigate if restarts exceed 5 in 10 minutes

4. **Environment Validation**
   - Always verify correct environment before operations
   - Use separate environments for dev/staging/prod

5. **Alert Thresholds**
   - Health checks: 3+ failures = alert
   - Restarts: 5+ in 10 min = investigate
   - Build time: > 5 min = check dependencies
   - Error rate: > 5% = investigate

---

## Related Documentation

- **Main Deployment Guide:** `RAILWAY_DEPLOYMENT.md`
- **Railway CLI Docs:** https://docs.railway.app/reference/cli
- **Railway Project Dashboard:** https://railway.com/project/36380b1b-232c-4c2a-a198-c886fd7b190d
- **Health Check Guide:** https://docs.railway.app/guides/healthchecks

---

## Support

For issues or questions:

1. **Railway Status:** https://status.railway.app
2. **Railway Discord:** https://discord.gg/railway
3. **Railway Docs:** https://docs.railway.app
4. **Project Issues:** Check `railway status` and service logs

---

**Last Updated:** 2026-01-14

**Script Version:** 1.0.0
