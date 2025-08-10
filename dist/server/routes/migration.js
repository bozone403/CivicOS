import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function registerMigrationRoutes(app) {
    // Apply database migration endpoint
    app.post("/api/migration/apply", async (req, res) => {
        try {
            // console.log removed for production
            // Read the SQL migration file
            const migrationPath = path.join(__dirname, '..', '..', 'fix-all-production-issues.sql');
            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
            // console.log removed for production
            // Split the SQL into individual statements
            const statements = migrationSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            // console.log removed for production
            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                try {
                    await pool.query(statement);
                    successCount++;
                    // console.log removed for production
                }
                catch (error) {
                    errorCount++;
                    const errorMsg = `Statement ${i + 1}/${statements.length} failed: ${error.message}`;
                    errors.push(errorMsg);
                    // console.log removed for production
                }
            }
            // console.log removed for production
            // console.log removed for production
            // console.log removed for production
            // console.log removed for production
            res.json({
                success: errorCount === 0,
                message: errorCount === 0 ? 'Database migration completed successfully' : 'Database migration completed with errors',
                results: {
                    successful: successCount,
                    failed: errorCount,
                    total: statements.length,
                    errors: errors
                }
            });
        }
        catch (error) {
            // console.error removed for production
            res.status(500).json({
                success: false,
                message: 'Database migration failed',
                error: error.message
            });
        }
    });
    // Test database connection endpoint
    app.get("/api/migration/test", async (req, res) => {
        try {
            const result = await pool.query('SELECT NOW() as now');
            res.json({
                success: true,
                message: 'Database connection successful',
                timestamp: result.rows[0].now
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Database connection failed',
                error: error.message
            });
        }
    });
    // Check table existence endpoint
    app.get("/api/migration/tables", async (req, res) => {
        try {
            const tables = [
                'social_conversations', 'social_messages', 'social_notifications',
                'social_activities', 'social_bookmarks', 'social_shares',
                'system_health', 'analytics_events', 'identity_verifications',
                'user_permissions', 'permissions', 'user_membership_history',
                'payments', 'file_uploads', 'webhooks', 'development_logs',
                'voting_items', 'votes', 'news_articles', 'legal_documents',
                'government_integrity', 'events'
            ];
            const results = {};
            for (const table of tables) {
                try {
                    const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = $1
          `, [table]);
                    results[table] = {
                        exists: result.rows.length > 0,
                        status: result.rows.length > 0 ? '✅ Exists' : '❌ Missing'
                    };
                }
                catch (error) {
                    results[table] = {
                        exists: false,
                        status: '❌ Error',
                        error: error.message
                    };
                }
            }
            const existingTables = Object.keys(results).filter(table => results[table].exists);
            const missingTables = Object.keys(results).filter(table => !results[table].exists);
            res.json({
                success: true,
                results,
                summary: {
                    total: tables.length,
                    existing: existingTables.length,
                    missing: missingTables.length,
                    existingTables,
                    missingTables
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to check tables',
                error: error.message
            });
        }
    });
}
