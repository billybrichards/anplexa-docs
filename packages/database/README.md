# @anplexa/database

Consolidated Drizzle ORM schema package for the Anplexa monorepo. Provides database schema definitions, type exports, and database client utilities for both PostgreSQL and SQLite.

## Features

- **Dual Database Support**: Seamlessly supports both PostgreSQL and SQLite
- **Type-Safe Schema**: Full TypeScript support with Drizzle ORM type inference
- **Centralized Schema**: Single source of truth for all database tables
- **Relations**: Drizzle relations configured for all major tables
- **Environment-Based Dialect Selection**: Automatically selects database dialect based on `DATABASE_URL`

## Installation

This package is part of the monorepo and uses workspace dependencies.

```bash
npm install
```

## Usage

### Importing Schema

```typescript
import {
  users,
  conversations,
  messages,
  sessions,
  // ... other tables
} from '@anplexa/database';

import type {
  User,
  Conversation,
  Message,
  // ... other types
} from '@anplexa/database';
```

### Using Database Client

```typescript
import { getDatabase, initializeDatabase } from '@anplexa/database';

// Get database instance
const db = getDatabase();

// Or initialize and get in one call
const db = initializeDatabase();

// Use with Drizzle ORM queries
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, 'user-123'),
});
```

## Database Configuration

The database dialect is determined by the `DATABASE_URL` environment variable:

- **PostgreSQL**: Set `DATABASE_URL=postgres://...`
- **SQLite**: Set `DATABASE_URL=file:./data/companion.db` or leave unset (defaults to SQLite)

## Schema Tables

### Core Tables
- `users` - User accounts with authentication and preferences
- `conversations` - User conversations with the companion
- `messages` - Individual messages in conversations
- `sessions` - Authentication sessions
- `userPreferences` - User-specific preferences overriding defaults

### Configuration
- `companionConfig` - Global companion AI configuration and system prompts

### Email & Communication
- `emailQueue` - Scheduled email sends
- `emailLogs` - Sent email tracking

### API & Integration
- `apiKeys` - User API keys
- `apiUsage` - API request tracking
- `apiUsageDaily` - Aggregated daily API usage
- `funnelApiKeys` - External funnel API keys

### Authentication & Security
- `passwordResetTokens` - Password reset tokens
- `magicLinkTokens` - Passwordless authentication tokens
- `exchangeTokens` - Short-lived exchange codes for secure redirects

### CRM & Marketing
- `contactSubmissions` - Master audit log of all contact submissions
- `systemPrompts` - System prompt versions with audit trail

### Other
- `conversationContext` - Memory and context summaries for long conversations
- `userFeedback` - User feedback and feature requests

## TypeScript Types

All tables export TypeScript types for both select and insert operations:

```typescript
// Select type (what you get from the database)
export type User = typeof users.$inferSelect;

// Insert type (what you pass to insert)
export type NewUser = typeof users.$inferInsert;
```

Available types:
- `User`, `NewUser`
- `Conversation`
- `Message`
- `UserPreferences`
- `UserFeedback`
- `ApiKey`, `ApiUsage`, `ApiUsageDaily`
- `PasswordResetToken`, `MagicLinkToken`, `SystemPrompt`
- `EmailQueue`, `EmailLog`
- `FunnelApiKey`
- `ContactSubmission`
- `ExchangeToken`
- `CompanionConfig`

## Database Migrations

Run Drizzle Kit commands from this package:

```bash
# Generate migration files
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Drizzle Studio for visual database inspection
npm run db:studio
```

## Schema Design Philosophy

### PostgreSQL vs SQLite

Both dialects maintain identical table structures and exported types. Key differences:

- **PostgreSQL**: Uses `doublePrecision` for floating-point numbers, native `boolean` type
- **SQLite**: Uses `real` for floating-point numbers, integer booleans with mode: 'boolean'

The schema switcher (`src/schema/index.ts`) automatically selects the correct dialect based on `DATABASE_URL`.

### Data Types

- **IDs**: Text (UUID format recommended)
- **Dates**: Text (ISO 8601 format recommended)
- **Booleans**: SQLite uses integers with `mode: 'boolean'` for automatic conversion
- **JSON**: Stored as text and parsed by application code

## Relations

Drizzle relations are configured for:
- `users -> conversations` (one-to-many)
- `users -> userPreferences` (one-to-one)
- `users -> userFeedback` (one-to-many)
- `users -> sessions` (one-to-many)
- `conversations -> messages` (one-to-many)
- `conversations -> conversationContext` (one-to-one)
- `messages -> conversations` (many-to-one)

## Development

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Notes

- All timestamps use text fields with ISO 8601 format
- Email fields are unique at the database level
- User IDs are referenced by both core tables and CRM tables
- The `contactSubmissions` table is append-only for audit trail purposes
- Magic link and exchange tokens have short expiry times (typically 5-15 minutes)
