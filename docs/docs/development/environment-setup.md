---
sidebar_position: 2
---

# Environment Setup

> **ℹ️ NEEDS UPDATE**: This guide references legacy app names. Update in progress:
> - `2-terminal-companion` → `apps/api`
> - `v0-ai-companion-prototype` → `apps/companions`
> - `Funnel-Forge` → `apps/funnel`

Complete reference for environment variables across all Anplexa applications.

## Overview

Each application requires its own environment configuration:

| Application | File | Template |
|-------------|------|----------|
| **Backend API** | `.env` | `.env.example` |
| **Companions App** | `.env.local` | `.env.example` |
| **Funnel App** | `.env` | `.env.example` |

## Backend API (`2-terminal-companion`)

The API server handles authentication, chat, database operations, and external service integrations.

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | Database connection string |

**SQLite (Development):**
```bash
DATABASE_URL=file:./data/companion.db
```

**PostgreSQL (Production):**
```bash
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

### Ollama LLM Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OLLAMA_BASE_URL` | Yes | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_API_KEY` | Yes | - | API key for Ollama authentication |
| `OLLAMA_GENERAL_MODEL` | No | `darkplanet-general:latest` | Model for general chat |
| `OLLAMA_LONGFORM_MODEL` | No | `dolphin-mixtral:latest` | Model for detailed responses |

### JWT Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for JWT signing (min 32 chars) |
| `JWT_ACCESS_EXPIRES` | No | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRES` | No | `7d` | Refresh token expiration |

```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

### Stripe Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Yes | - | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | - | Stripe publishable key (`pk_test_...` or `pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Yes | - | Webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_MONTHLY` | Yes | - | Monthly subscription price ID |
| `STRIPE_PRICE_YEARLY` | Yes | - | Yearly subscription price ID |

```bash
# Example Stripe configuration
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_1Sj3Q4Hf3F7YsE79EfGL6BuF
STRIPE_PRICE_YEARLY=price_1SkBhsHf3F7YsE79UDhlyjdG
```

### Email (Resend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | Yes | - | Resend API key (`re_...`) |

### CORS and Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Frontend URL for CORS |

### Funnel Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FUNNEL_API_SECRET` | Yes | - | API key for Funnel app authentication |

### Admin User

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_EMAIL` | No | `admin@example.com` | Initial admin email |
| `ADMIN_PASSWORD` | No | - | Initial admin password |

### Complete API `.env` Example

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/anplexa_dev

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=your-ollama-api-key
OLLAMA_GENERAL_MODEL=darkplanet-general:latest
OLLAMA_LONGFORM_MODEL=dolphin-mixtral:latest

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...

# Email
RESEND_API_KEY=re_...

# CORS
FRONTEND_URL=http://localhost:3000

# Funnel
FUNNEL_API_SECRET=your-funnel-api-secret

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-admin-password
```

---

## Companions App (`v0-ai-companion-prototype`)

The Next.js chat interface application.

### Backend API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_URL` | Yes | - | Backend URL for server-side API calls |
| `NEXT_PUBLIC_API_URL` | Yes | - | Backend URL for client-side calls |
| `BACKEND_API_KEY` | No | - | API key for server-to-server requests |

```bash
# Development
API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Production
API_URL=https://api.anplexa.com
NEXT_PUBLIC_API_URL=https://api.anplexa.com
```

### Stripe Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET` | Yes | - | Stripe secret key |
| `STRIPE_PUBLIC` | Yes | - | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | - | Webhook signing secret |
| `STRIPE_PRICE_MONTHLY` | Yes | - | Monthly price ID |
| `STRIPE_PRICE_YEARLY` | Yes | - | Yearly price ID |

### Analytics

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | No | - | PostHog project key (`phc_...`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` | PostHog instance URL |
| `NEXT_PUBLIC_CLARITY_ID` | No | - | Microsoft Clarity project ID |

### Email

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANPLEXA_RESEND_API_KEY` | No | - | Resend API key for transactional emails |

### Database (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_URL` | No | - | PostgreSQL connection (pooling) |
| `POSTGRES_URL_NON_POOLING` | No | - | PostgreSQL connection (direct) |

### Session Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_SECRET` | Yes | - | Secret for session encryption (32+ chars) |

### Complete Companions `.env.local` Example

```bash
# Backend API
API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
BACKEND_API_KEY=your-backend-api-key

# Stripe
STRIPE_SECRET=sk_test_...
STRIPE_PUBLIC=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...

# Email
ANPLEXA_RESEND_API_KEY=re_...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# NEXT_PUBLIC_CLARITY_ID=your-clarity-id

# Database (optional)
# POSTGRES_URL=postgresql://...
# POSTGRES_URL_NON_POOLING=postgresql://...

# Session
SESSION_SECRET=your-32-character-session-secret
```

---

## Funnel App (`Funnel-Forge`)

The marketing funnel with personality quiz and Stripe checkout.

### Backend API Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BACKEND_API_URL` | Yes | - | Backend API base URL |
| `BACKEND_API_KEY` | Yes | - | General API authentication key |
| `FUNNEL_API_KEY` | Yes | - | Funnel-specific API key (user creation) |

### Stripe Integration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET` | Yes | - | Production Stripe secret key |
| `STRIPE_PUBLIC` | Yes | - | Production Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | - | Webhook signing secret |
| `STRIPE_SANDBOX_SECRET` | No | - | Test mode secret key |
| `STRIPE_SANDBOX_PUBLIC` | No | - | Test mode publishable key |
| `STRIPE_PRICE_MONTHLY` | Yes | - | Monthly price ID |
| `STRIPE_PRICE_YEARLY` | Yes | - | Yearly price ID |

### Analytics (Client-Side)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_PUBLIC_POSTHOG_KEY` | No | - | PostHog project key |
| `VITE_PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` | PostHog instance URL |

:::note
Vite uses the `VITE_PUBLIC_` prefix for client-exposed variables, while Next.js uses `NEXT_PUBLIC_`.
:::

### Email

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANPLEXA_RESEND_API_KEY` | Yes | - | Resend API key |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |

### Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | Environment mode |

### Redirect URLs

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAIN_APP_URL` | Yes | - | Companions app URL for post-funnel redirects |

### Session Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SESSION_SECRET` | Yes | - | Session encryption secret |

### Complete Funnel `.env` Example

```bash
# Backend API
BACKEND_API_URL=http://localhost:5000
BACKEND_API_KEY=your-backend-api-key
FUNNEL_API_KEY=your-funnel-api-key

# Stripe (Production)
STRIPE_SECRET=sk_live_...
STRIPE_PUBLIC=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...

# Stripe (Sandbox - Optional)
STRIPE_SANDBOX_SECRET=sk_test_...
STRIPE_SANDBOX_PUBLIC=pk_test_...

# Email
ANPLEXA_RESEND_API_KEY=re_...

# Analytics
VITE_PUBLIC_POSTHOG_KEY=phc_...
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Server
PORT=5000
NODE_ENV=development

# Session
SESSION_SECRET=your-32-character-session-secret

# Redirects
MAIN_APP_URL=http://localhost:3000
```

---

## Development vs Production Settings

### Development Defaults

| Setting | Development | Production |
|---------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| Database | SQLite or local PostgreSQL | Cloud PostgreSQL (Neon, Supabase) |
| Stripe | Test keys (`sk_test_`, `pk_test_`) | Live keys (`sk_live_`, `pk_live_`) |
| CORS | `http://localhost:*` | Specific domain only |
| JWT Expiry | 15m access / 7d refresh | Same or shorter |
| Logging | Verbose | Errors only |

### Production Checklist

Before deploying to production:

- [ ] All `NODE_ENV` values set to `production`
- [ ] Database URLs point to production PostgreSQL
- [ ] Stripe keys are live mode (not test)
- [ ] JWT_SECRET is unique and cryptographically secure
- [ ] FRONTEND_URL matches actual production domain
- [ ] Webhook secrets are configured for production endpoints
- [ ] Analytics keys point to production projects
- [ ] Session secrets are unique per environment

---

## Secret Management

### Local Development

For local development, use `.env` files (never commit to git):

```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### Production Secrets

For production deployments, use platform-specific secret management:

| Platform | Secret Management |
|----------|-------------------|
| **Vercel** | Environment Variables (Dashboard or CLI) |
| **Replit** | Secrets tab (encrypted storage) |
| **Railway** | Variables section |
| **AWS** | Secrets Manager or Parameter Store |
| **Docker** | Docker secrets or environment files |

### Generating Secure Secrets

```bash
# Generate JWT secret (32+ bytes)
openssl rand -base64 32

# Generate session secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API key (URL-safe)
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

### Environment Variable Precedence

Next.js loads environment variables in this order (later overrides earlier):

1. `.env` - Default values
2. `.env.local` - Local overrides (not in git)
3. `.env.development` - Development-specific
4. `.env.production` - Production-specific
5. System environment variables

---

## Cross-App Variable Sync

Several variables must be consistent across all applications:

| Variable | Apps | Notes |
|----------|------|-------|
| `STRIPE_PRICE_MONTHLY` | API, Companions, Funnel | Must match Stripe Dashboard |
| `STRIPE_PRICE_YEARLY` | API, Companions, Funnel | Must match Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | API, Companions, Funnel | Per-endpoint secrets |
| `FUNNEL_API_SECRET` / `FUNNEL_API_KEY` | API, Funnel | Must match for auth |

When updating Stripe price IDs or API keys, update all three applications simultaneously.
