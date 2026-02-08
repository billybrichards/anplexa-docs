// Drizzle database client setup
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { Pool } from 'pg';
import Database from 'better-sqlite3';
import * as schemaPostgres from './schema/postgres.js';
import * as schemaSqlite from './schema/sqlite.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any = null;

/**
 * Get or create a database connection based on DATABASE_URL environment variable
 * Supports both PostgreSQL and SQLite
 */
export function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const isPostgres = databaseUrl?.startsWith('postgres');

  if (isPostgres && databaseUrl) {
    // PostgreSQL connection
    const pool = new Pool({
      connectionString: databaseUrl,
    });

    dbInstance = drizzle(pool, { schema: schemaPostgres });
  } else {
    // SQLite connection (default)
    const dbPath = databaseUrl || 'file:./data/companion.db';
    // Remove 'file:' prefix if present for better-sqlite3
    const cleanPath = dbPath.replace('file:', '');
    const sqliteDb = new Database(cleanPath);

    dbInstance = drizzleSqlite(sqliteDb, { schema: schemaSqlite });
  }

  return dbInstance;
}

// Type for the database instance
export type Database = ReturnType<typeof getDatabase>;

// Initialize database on module load (optional)
// This can help catch connection issues early
export function initializeDatabase() {
  return getDatabase();
}
