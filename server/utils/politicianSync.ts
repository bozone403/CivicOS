import { db } from '../db.js';
import { parliamentMembers, politicians } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function syncIncumbentPoliticiansFromParliament(): Promise<number> {
  const mps = await db.select().from(parliamentMembers).where(eq(parliamentMembers.active, true));
  let upserts = 0;
  for (const mp of mps as any[]) {
    const pmId = mp.memberId as string;
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
    } else {
      await db.update(politicians).set({
        name: mp.name,
        party: mp.party || (existing as any).party,
        constituency: mp.constituency || (existing as any).constituency,
        isIncumbent: true,
        updatedAt: new Date(),
      }).where(eq(politicians.id, (existing as any).id));
    }
  }
  return upserts;
}


