// Schema exporter - exports both PostgreSQL and SQLite schemas separately
// Import the specific schema needed in your application:
// - For PostgreSQL: import { postgres as schema } from '@anplexa/database';
// - For SQLite: import { sqlite as schema } from '@anplexa/database';

// Export both schemas as named exports
export * as postgres from './postgres.js';
export * as sqlite from './sqlite.js';

// Note: Choose the appropriate schema based on your database type
// This prevents type mismatches between SQLite and PostgreSQL Drizzle instances
