import { db } from '../db.js';
import { parliamentMembers, politicians } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
export async function syncIncumbentPoliticiansFromParliament() {
    try {
        const mps = await db.select().from(parliamentMembers).where(eq(parliamentMembers.active, true));
        let upserts = 0;
        for (const mp of mps) {
            try {
                const pmId = mp.memberId;
                if (!pmId)
                    continue; // Skip if no member ID
                const [existing] = await db.select().from(politicians).where(eq(politicians.parliamentMemberId, pmId)).limit(1);
                if (!existing) {
                    await db.insert(politicians).values({
                        name: mp.name || 'Unknown',
                        party: mp.party || null,
                        position: 'Member of Parliament',
                        parliamentMemberId: pmId,
                        constituency: mp.constituency || null,
                        level: 'Federal',
                        jurisdiction: 'Canada',
                        isIncumbent: true,
                    });
                    upserts++;
                }
                else {
                    await db.update(politicians).set({
                        name: mp.name || existing.name,
                        party: mp.party || existing.party,
                        constituency: mp.constituency || existing.constituency,
                        isIncumbent: true,
                        updatedAt: new Date(),
                    }).where(eq(politicians.id, existing.id));
                }
            }
            catch (mpError) {
                // Log individual MP sync errors but continue with others
                console.error('Failed to sync MP:', mp, mpError);
                continue;
            }
        }
        return upserts;
    }
    catch (error) {
        console.error('Politician sync failed:', error);
        return 0; // Return 0 on error instead of throwing
    }
}
