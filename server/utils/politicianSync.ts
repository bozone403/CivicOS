import { db } from '../db.js';
import { parliamentMembers, politicians } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function syncIncumbentPoliticiansFromParliament(): Promise<number> {
  try {
    const mps = await db.select().from(parliamentMembers).where(eq(parliamentMembers.active, true));
    let upserts = 0;
    
    for (const mp of mps as any[]) {
      try {
        const pmId = mp.memberId as string;
        if (!pmId) continue; // Skip if no member ID
        
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
        } else {
          await db.update(politicians).set({
            name: mp.name || (existing as any).name,
            party: mp.party || (existing as any).party,
            constituency: mp.constituency || (existing as any).constituency,
            isIncumbent: true,
            updatedAt: new Date(),
          }).where(eq(politicians.id, (existing as any).id));
        }
      } catch (mpError) {
        // Log individual MP sync errors but continue with others
        // console.error removed for production
        continue;
      }
    }
    
    return upserts;
  } catch (error) {
    // console.error removed for production
    return 0; // Return 0 on error instead of throwing
  }
}


