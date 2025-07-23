import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema.js';
import pino from "pino";
const logger = pino();
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
// Parse connection string for paranoid logging
function parseDbUrl(url) {
    try {
        const u = new URL(url);
        return {
            host: u.hostname,
            port: u.port,
            user: u.username,
            database: u.pathname.replace(/^\//, ''),
            ssl: u.search.includes('sslmode') ? u.search : 'default',
        };
    }
    catch {
        return { host: 'unknown', port: 'unknown', user: 'unknown', database: 'unknown', ssl: 'unknown' };
    }
}
const dbInfo = parseDbUrl(process.env.DATABASE_URL);
logger.info('[DB] Connecting to:', {
    host: dbInfo.host,
    port: dbInfo.port,
    user: dbInfo.user,
    database: dbInfo.database,
    ssl: dbInfo.ssl,
    sslConfig: { rejectUnauthorized: false },
});
// SSL configuration for Supabase
const sslConfig = process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
} : {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
};
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
});
// Paranoid: Drizzle does not accept 'ssl' in config, so we rely on Pool's SSL config only
export const db = drizzle(pool, { schema });
// Paranoid logging: log Pool type and SSL env (do NOT log credentials)
logger.info('[DB] Drizzle instantiated. Pool type:', typeof pool, 'NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
// Paranoid: Test DB connection at startup
(async () => {
    try {
        const result = await pool.query('SELECT NOW() as now');
        logger.info('[DB] Connection test successful. Time:', result.rows[0].now);
    }
    catch (err) {
        logger.error('[DB] Connection test FAILED:', err);
        if (err && typeof err === 'object' && err !== null && 'code' in err && err.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
            logger.error('[DB] SSL self-signed certificate error. Check your DATABASE_URL and SSL config.');
        }
        // Don't exit in production, just log the error
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
})();
