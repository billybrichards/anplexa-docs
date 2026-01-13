// Database package - exports Drizzle ORM schema and database client utilities

// Export all schema tables and types
export * from './schema/index.js';

// Export database client utilities
export { getDatabase } from './client.js';
export type { Database } from './client.js';
