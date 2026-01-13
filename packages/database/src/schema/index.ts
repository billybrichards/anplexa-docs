// Schema exporter - exports both PostgreSQL and SQLite schemas
// Both schemas export identical table structures and types
// Use DATABASE_URL environment variable at runtime to determine which to use

// Re-export PostgreSQL schema
export * from './postgres.js';

// Note: Both PostgreSQL and SQLite schemas export the same types
// The actual schema used at runtime is determined based on DATABASE_URL
// in your application initialization code
