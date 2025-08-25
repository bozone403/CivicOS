import { db } from '../db.js';
import { jwtAuth } from './auth.js';
import { requirePermission } from '../utils/permissionService.js';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { identityVerifications } from '../../shared/identity-schema.js';
import { notifications } from '../../shared/schema.js';
import { users } from '../../shared/schema.js';
const submitSchema = z.object({
    email: z.string().email(),
    captchaToken: z.string().min(10).optional(),
    termsAgreed: z.boolean(),
    idFrontUrl: z.string().url().optional(),
    idBackUrl: z.string().url().optional(),
    selfieUrl: z.string().url().optional(),
    livenessVideoUrl: z.string().url().optional(),
});
export function registerIdentityRoutes(app) {
    // Submit verification request (user)
    app.post('/api/identity/submit', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const parsed = submitSchema.safeParse(req.body);
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (!parsed.success) {
                return res.status(400).json({ message: 'Invalid input', errors: parsed.error.flatten() });
            }
            const { email, termsAgreed, captchaToken, idFrontUrl, idBackUrl, selfieUrl, livenessVideoUrl } = parsed.data;
            const [record] = await db.insert(identityVerifications).values({
                userId,
                email,
                status: 'pending',
                submittedAt: new Date(),
                termsAgreed: termsAgreed ?? false,
                captchaToken: captchaToken || null,
                idFrontUrl: idFrontUrl || null,
                idBackUrl: idBackUrl || null,
                selfieUrl: selfieUrl || null,
                livenessVideoUrl: livenessVideoUrl || null,
                ipAddress: req.ip || null,
                userAgent: req.headers['user-agent'] || null,
            }).returning();
            return res.status(201).json({ success: true, verification: record });
        }
        catch (error) {
            return res.status(500).json({ message: 'Failed to submit verification' });
        }
    });
    // Admin: list verifications (queue)
    app.get('/api/admin/identity-verifications', jwtAuth, requirePermission('admin.identity.review'), async (req, res) => {
        const user = req.user;
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { status = 'pending', limit = '50', offset = '0' } = req.query;
        const limitNum = Math.min(parseInt(String(limit)) || 50, 200);
        const offsetNum = parseInt(String(offset)) || 0;
        try {
            const results = await db
                .select()
                .from(identityVerifications)
                .where(eq(identityVerifications.status, String(status)))
                .orderBy(desc(identityVerifications.submittedAt))
                .limit(limitNum)
                .offset(offsetNum);
            return res.json(results);
        }
        catch {
            return res.status(500).json({ message: 'Failed to fetch verifications' });
        }
    });
    // Compatibility endpoint for existing admin panel
    app.get('/api/pending-verifications', jwtAuth, async (req, res) => {
        const user = req.user;
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        try {
            const results = await db
                .select()
                .from(identityVerifications)
                .where(eq(identityVerifications.status, 'pending'))
                .orderBy(desc(identityVerifications.submittedAt))
                .limit(100);
            return res.json(results);
        }
        catch {
            return res.status(500).json({ message: 'Failed to fetch pending verifications' });
        }
    });
    // Approve verification
    app.post('/api/admin/identity-verifications/:verificationId/approve', jwtAuth, requirePermission('admin.identity.review'), async (req, res) => {
        const user = req.user;
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { verificationId } = req.params;
        try {
            // Mark verification approved
            await db
                .update(identityVerifications)
                .set({ status: 'approved', reviewedAt: new Date(), reviewedBy: user.id })
                .where(eq(identityVerifications.id, Number(verificationId)));
            // Elevate user verification flags
            const rec = await db
                .select({ userId: identityVerifications.userId })
                .from(identityVerifications)
                .where(eq(identityVerifications.id, Number(verificationId)))
                .limit(1);
            const targetUserId = rec[0]?.userId;
            if (targetUserId) {
                await db
                    .update(users)
                    .set({
                    isVerified: true,
                    verificationLevel: 'verified',
                    governmentIdVerified: true,
                    updatedAt: new Date(),
                })
                    .where(eq(users.id, targetUserId));
                // Emit notification to the user
                await db.insert(notifications).values({
                    userId: targetUserId,
                    type: 'identity',
                    title: 'Identity Verification Approved',
                    message: 'Your identity verification has been approved. You now have full access.',
                    data: { verificationId },
                    sourceModule: 'identity',
                    sourceId: String(verificationId),
                    createdAt: new Date(),
                });
            }
            return res.json({ success: true });
        }
        catch {
            return res.status(500).json({ message: 'Failed to approve verification' });
        }
    });
    // Reject verification
    app.post('/api/admin/identity-verifications/:verificationId/reject', jwtAuth, requirePermission('admin.identity.review'), async (req, res) => {
        const user = req.user;
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { verificationId } = req.params;
        const { reason } = (req.body || {});
        try {
            await db
                .update(identityVerifications)
                .set({ status: 'rejected', reviewedAt: new Date(), reviewedBy: user.id, flaggedReasons: sql `${identityVerifications.flaggedReasons} || ${JSON.stringify([reason || 'manual_reject'])}::jsonb` })
                .where(eq(identityVerifications.id, Number(verificationId)));
            // Notify user on rejection
            const rec = await db
                .select({ userId: identityVerifications.userId })
                .from(identityVerifications)
                .where(eq(identityVerifications.id, Number(verificationId)))
                .limit(1);
            const targetUserId = rec[0]?.userId;
            if (targetUserId) {
                await db.insert(notifications).values({
                    userId: targetUserId,
                    type: 'identity',
                    title: 'Identity Verification Rejected',
                    message: `Your identity verification was rejected.${reason ? ' Reason: ' + reason : ''}`,
                    data: { verificationId, reason: reason || null },
                    sourceModule: 'identity',
                    sourceId: String(verificationId),
                    createdAt: new Date(),
                });
            }
            return res.json({ success: true });
        }
        catch {
            return res.status(500).json({ message: 'Failed to reject verification' });
        }
    });
    // Backward-compatible admin endpoints used by another UI
    app.get('/api/admin/verification-queue', jwtAuth, async (req, res) => {
        const user = req.user;
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        try {
            const results = await db
                .select()
                .from(identityVerifications)
                .where(eq(identityVerifications.status, 'pending'))
                .orderBy(desc(identityVerifications.submittedAt))
                .limit(100);
            return res.json(results);
        }
        catch {
            return res.status(500).json({ message: 'Failed to fetch verification queue' });
        }
    });
    app.post('/api/admin/approve-verification', jwtAuth, async (req, res) => {
        const user = req.user;
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { verificationId } = (req.body || {});
        if (!verificationId)
            return res.status(400).json({ message: 'verificationId required' });
        try {
            await db
                .update(identityVerifications)
                .set({ status: 'approved', reviewedAt: new Date(), reviewedBy: user.id })
                .where(eq(identityVerifications.id, Number(verificationId)));
            return res.json({ success: true });
        }
        catch {
            return res.status(500).json({ message: 'Failed to approve verification' });
        }
    });
    app.post('/api/admin/reject-verification', jwtAuth, async (req, res) => {
        const user = req.user;
        if (!user || user.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { verificationId, reason } = (req.body || {});
        if (!verificationId)
            return res.status(400).json({ message: 'verificationId required' });
        try {
            await db
                .update(identityVerifications)
                .set({ status: 'rejected', reviewedAt: new Date(), reviewedBy: user.id, flaggedReasons: sql `${identityVerifications.flaggedReasons} || ${JSON.stringify([reason || 'manual_reject'])}::jsonb` })
                .where(eq(identityVerifications.id, Number(verificationId)));
            return res.json({ success: true });
        }
        catch {
            return res.status(500).json({ message: 'Failed to reject verification' });
        }
    });
}
