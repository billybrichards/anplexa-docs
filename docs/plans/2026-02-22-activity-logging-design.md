# Activity Logging System Design

## Context

The Anplexa platform has no unified logging system. Frontend analytics is a console-only stub, backend uses Morgan for HTTP logs but nothing persists to the database. When debugging user flows (especially the onboarding funnel), there's no way to trace what happened from the user's first click through to the API response.

This design adds a single `activity_logs` table and supporting infrastructure to capture the full user journey — frontend interactions, API calls, errors — in one queryable place.

## Architecture

### Database: `activity_logs` table

Added to `packages/database/src/schema/postgres.ts`:

| Column | Type | Purpose |
|--------|------|---------|
| id | text (PK) | UUID |
| user_id | text (nullable) | FK to users, null for anonymous |
| session_id | text (nullable) | Browser session ID |
| event_type | text | Category: page_view, click, api_request, api_error, frontend_error, navigation, onboarding_step |
| event_name | text | Specific event name |
| source | text | 'frontend' or 'backend' |
| request_id | text (nullable) | UUID linking frontend request to backend processing |
| method | text (nullable) | HTTP method |
| path | text (nullable) | URL path |
| status_code | integer (nullable) | HTTP status code |
| duration_ms | integer (nullable) | Response time |
| metadata | text (nullable) | JSON string for event-specific data |
| error_message | text (nullable) | Error message |
| error_stack | text (nullable) | Stack trace (non-production only) |
| user_agent | text (nullable) | Browser user agent |
| ip_address | text (nullable) | Client IP |
| referrer | text (nullable) | HTTP referrer |
| created_at | text | ISO 8601 timestamp |

Indexes: `(user_id, created_at DESC)`, `(event_type, created_at DESC)`, `(request_id)`, `(session_id, created_at DESC)`.

### Event Flow

```
Frontend → queues events in memory → flushes batch every 5s → POST /api/logs → activity_logs table
Backend middleware → auto-logs every API request on response finish → activity_logs table
Correlation → X-Request-ID header links frontend API calls to backend processing
```

### Components

1. **ActivityLogRepository** — Drizzle repository with create, createBatch, query, getByRequestId, getUserJourney, deleteOlderThan
2. **Activity Logger Middleware** — Express middleware that auto-logs all API requests (fire-and-forget)
3. **POST /api/logs endpoint** — Receives batched frontend events (max 50 per batch), responds 202 immediately
4. **Frontend ActivityLogger** — Client-side logger with batching, sessionStorage session IDs, sendBeacon on page unload
5. **API Client integration** — X-Request-ID header generation and timing for request correlation

### Files Changed

New: middleware/activityLogger.ts, routes/logs/index.ts, repositories/activity-log.repository.ts, repository interface
Modified: postgres.ts schema, container.ts, app.ts, analytics.ts, api-client.ts

## Implementation Phases

1. Schema + Repository (foundation)
2. Backend auto-logging middleware + /api/logs endpoint
3. Frontend ActivityLogger + API client correlation
4. End-to-end verification
