import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root (../../.env from packages/database)
config({ path: resolve(__dirname, '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/companion.db';
const isPostgres = DATABASE_URL.startsWith('postgres');

export default defineConfig(
  isPostgres
    ? {
        schema: './src/schema/postgres.ts',
        out: './drizzle',
        dialect: 'postgresql',
        dbCredentials: {
          url: DATABASE_URL,
        },
      }
    : {
        schema: './src/schema/sqlite.ts',
        out: './drizzle',
        dialect: 'sqlite',
        dbCredentials: {
          url: './data/companion.db',
        },
      }
);
