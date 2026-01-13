// Schema exporter - exports both PostgreSQL and SQLite schemas
// Both schemas export similar table structures and types
// Use DATABASE_URL environment variable at runtime to determine which to use

// Re-export SQLite schema by default (most compatible for testing)
export * from './sqlite.js';

// Note: Both PostgreSQL and SQLite schemas export compatible types
// The actual schema used at runtime is determined based on DATABASE_URL
// in your application initialization code
