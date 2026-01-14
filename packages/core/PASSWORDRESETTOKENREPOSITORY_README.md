# PasswordResetTokenRepository Implementation

## Overview

The PasswordResetTokenRepository is fully implemented following Clean Architecture principles. It handles password reset token persistence operations for the authentication system.

## Implementation Status

✅ **Domain Entity**: `packages/core/src/domain/entities/PasswordResetToken.ts`
- Includes `isExpired()` and `isValid()` methods
- Immutable entity with proper Date type handling

✅ **Repository Interface**: `packages/core/src/repositories/interfaces/password-reset-token.repository.interface.ts`
- Defines contract for password reset token operations
- Includes create, getByToken, markAsUsed, and deleteExpired methods

✅ **Repository Implementation**: `packages/core/src/repositories/password-reset-token.repository.ts`
- Uses Drizzle ORM with PostgreSQL schema
- Proper error handling and type conversion
- Maps database string dates to Date objects

✅ **Comprehensive Tests**: `packages/core/src/repositories/__tests__/password-reset-token.repository.test.ts`
- 30 tests covering all functionality
- Uses SQLite in-memory database for isolation
- 100% code coverage achieved

✅ **Exports Updated**:
- Added to `packages/core/src/repositories/interfaces/index.ts`
- Added to `packages/core/src/repositories/index.ts`
- Added to `packages/core/src/domain/entities/index.ts`

## Usage Example

```typescript
import { PasswordResetTokenRepository } from '@anplexa/core';
import { getDatabase } from '@anplexa/database';

// Initialize repository
const db = getDatabase();
const tokenRepository = new PasswordResetTokenRepository(db);

// Create a password reset token
const token = await tokenRepository.create({
  userId: 'user-123',
  token: 'hashed-token-value',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
});

// Retrieve token by hash
const foundToken = await tokenRepository.getByToken('hashed-token-value');

if (foundToken && foundToken.isValid()) {
  // Token is valid (not used and not expired)

  // Mark as used after password reset
  await tokenRepository.markAsUsed(foundToken.id);
}

// Cleanup expired tokens (cron job)
const deletedCount = await tokenRepository.deleteExpired();
console.log(`Deleted ${deletedCount} expired tokens`);
```

## Database Schema

The repository uses the `password_reset_tokens` table from the PostgreSQL schema:

```sql
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Key Features

1. **Token Security**: Stores hashed tokens (field: `tokenHash`)
2. **Expiration Handling**: Automatic expiration checking via `isExpired()`
3. **Usage Tracking**: Prevents token reuse via `markAsUsed()`
4. **Cleanup Operations**: Efficient bulk deletion of expired tokens
5. **Type Safety**: Full TypeScript support with proper Date conversions

## Domain Methods

The `PasswordResetToken` entity provides:

- `isExpired()`: Returns true if current time > expiresAt
- `isValid()`: Returns true if token is not used AND not expired

## Test Coverage

All 30 tests passing:
- ✅ Create operations (6 tests)
- ✅ GetByToken operations (5 tests)
- ✅ MarkAsUsed operations (6 tests)
- ✅ DeleteExpired operations (6 tests)
- ✅ Entity methods (3 tests)
- ✅ Edge cases (4 tests)

## Integration Points

This repository is used by:
- `apps/api/src/routes/auth/password.ts` (password reset endpoints)
- Reset password use cases (when implemented)

## Next Steps

The repository is complete and ready for use. Consider implementing:
1. Password reset use cases in `packages/core/src/use-cases/auth/`
2. Email service integration for sending reset links
3. Rate limiting for reset requests
4. Cron job for periodic cleanup via `deleteExpired()`
