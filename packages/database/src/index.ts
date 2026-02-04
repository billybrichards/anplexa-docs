// Database package - exports Drizzle ORM schema and database client utilities

// Export named schema modules (for explicit postgres/sqlite selection)
export * from './schema/index';

// Re-export postgres schema at top level for backward compatibility
// This allows: import { users, User } from '@anplexa/database'
export * from './schema/postgres';

// Export database client utilities
export { getDatabase } from './client';
export type { Database } from './client';

// Re-export drizzle-orm utilities to ensure consistent types across packages
export { eq, and, or, like, desc, asc, sql, lt, gt, gte, lte, ne, isNull, isNotNull, inArray, notInArray, between, notBetween, count, avg } from 'drizzle-orm';
