import { db } from "../db.js";
import { procurementContracts } from "../../shared/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ResponseFormatter } from "../utils/responseFormatter.js";
// JWT Auth middleware
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ResponseFormatter.unauthorized(res, "Missing or invalid token");
    }
    try {
        const token = authHeader.split(" ")[1];
        const secret = process.env.SESSION_SECRET;
        if (!secret) {
            return ResponseFormatter.unauthorized(res, "Server configuration error");
        }
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        return ResponseFormatter.unauthorized(res, "Invalid or expired token");
    }
}
export function registerProcurementRoutes(app) {
    // Get procurement data (DB-backed)
    app.get('/api/procurement', async (req, res) => {
        try {
            const procurementData = await db.select().from(procurementContracts).orderBy(desc(procurementContracts.createdAt));
            res.json({
                procurementData,
                total: procurementData.length,
                message: "Procurement data retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch procurement data' });
        }
    });
    // Get procurement by department
    app.get('/api/procurement/:jurisdiction', async (req, res) => {
        try {
            const { jurisdiction } = req.params; // kept param name for compatibility
            const procurementData = await db.select()
                .from(procurementContracts)
                .where(eq(procurementContracts.department, jurisdiction))
                .orderBy(desc(procurementContracts.createdAt));
            res.json({
                procurementData,
                total: procurementData.length,
                message: `Procurement data for ${jurisdiction} retrieved successfully`
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch procurement data for jurisdiction' });
        }
    });
    // Get procurement statistics
    app.get('/api/procurement/stats', async (req, res) => {
        try {
            const result = await db.execute(sql `
        SELECT 
          COUNT(*)::int AS total_contracts,
          COALESCE(SUM(value)::numeric, 0) AS total_value,
          COUNT(CASE WHEN awarded_on IS NOT NULL THEN 1 END)::int AS with_award_date,
          COUNT(DISTINCT department) AS departments,
          COUNT(DISTINCT supplier) AS suppliers
        FROM procurement_contracts
      `);
            const agg = result?.rows?.[0] || {};
            res.json({
                totalContracts: Number(agg.total_contracts ?? 0),
                totalValue: Number(agg.total_value ?? 0),
                withAwardDate: Number(agg.with_award_date ?? 0),
                departments: Number(agg.departments ?? 0),
                suppliers: Number(agg.suppliers ?? 0),
                message: "Procurement statistics retrieved successfully"
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch procurement statistics' });
        }
    });
}
