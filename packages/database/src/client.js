"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.initializeDatabase = initializeDatabase;
// Drizzle database client setup
const node_postgres_1 = require("drizzle-orm/node-postgres");
const better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
const pg_1 = require("pg");
const better_sqlite3_2 = __importDefault(require("better-sqlite3"));
const schemaPostgres = __importStar(require("./schema/postgres.js"));
const schemaSqlite = __importStar(require("./schema/sqlite.js"));
let dbInstance = null;
/**
 * Get or create a database connection based on DATABASE_URL environment variable
 * Supports both PostgreSQL and SQLite
 */
function getDatabase() {
    if (dbInstance) {
        return dbInstance;
    }
    const databaseUrl = process.env.DATABASE_URL;
    const isPostgres = databaseUrl?.startsWith('postgres');
    if (isPostgres && databaseUrl) {
        // PostgreSQL connection
        const pool = new pg_1.Pool({
            connectionString: databaseUrl,
        });
        dbInstance = (0, node_postgres_1.drizzle)(pool, { schema: schemaPostgres });
    }
    else {
        // SQLite connection (default)
        const dbPath = databaseUrl || 'file:./data/companion.db';
        // Remove 'file:' prefix if present for better-sqlite3
        const cleanPath = dbPath.replace('file:', '');
        const sqliteDb = new better_sqlite3_2.default(cleanPath);
        dbInstance = (0, better_sqlite3_1.drizzle)(sqliteDb, { schema: schemaSqlite });
    }
    return dbInstance;
}
// Initialize database on module load (optional)
// This can help catch connection issues early
function initializeDatabase() {
    return getDatabase();
}
