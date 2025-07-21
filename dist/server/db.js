import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema.js';
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
console.log('[DB] Connecting to:', {
    host: dbInfo.host,
    port: dbInfo.port,
    user: dbInfo.user,
    database: dbInfo.database,
    ssl: dbInfo.ssl,
    sslConfig: { rejectUnauthorized: false },
});
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
// Paranoid: Drizzle does not accept 'ssl' in config, so we rely on Pool's SSL config only
export const db = drizzle(pool, { schema });
// Paranoid logging: log Pool type and SSL env (do NOT log credentials)
console.log('[DB] Drizzle instantiated. Pool type:', typeof pool, 'NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
// Paranoid: Test DB connection at startup
(async () => {
    try {
        const result = await pool.query('SELECT NOW() as now');
        console.log('[DB] Connection test successful. Time:', result.rows[0].now);
    }
    catch (err) {
        console.error('[DB] Connection test FAILED:', err);
        if (err && typeof err === 'object' && err !== null && 'code' in err && err.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
            console.error('[DB] SSL self-signed certificate error. Check your DATABASE_URL and SSL config.');
        }
        process.exit(1);
    }
})();
