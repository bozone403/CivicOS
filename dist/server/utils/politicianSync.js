import { db } from '../db.js';
import { parliamentMembers, politicians } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
export async function syncIncumbentPoliticiansFromParliament() {
    const mps = await db.select().from(parliamentMembers).where(eq(parliamentMembers.active, true));
    let upserts = 0;
    for (const mp of mps) {
        const pmId = mp.memberId;
        const [existing] = await db.select().from(politicians).where(eq(politicians.parliamentMemberId, pmId)).limit(1);
        if (!existing) {
            await db.insert(politicians).values({
                name: mp.name,
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
                name: mp.name,
                party: mp.party || existing.party,
                constituency: mp.constituency || existing.constituency,
                isIncumbent: true,
                updatedAt: new Date(),
            }).where(eq(politicians.id, existing.id));
        }
    }
    return upserts;
}
