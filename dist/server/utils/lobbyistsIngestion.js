import { db } from '../db.js';
import { lobbyistOrgs } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
export async function ingestLobbyistsCurated(sample) {
    let upserts = 0;
    for (const org of sample) {
        const existing = await db.select().from(lobbyistOrgs).where(eq(lobbyistOrgs.name, org.name)).limit(1);
        if (existing.length === 0) {
            await db.insert(lobbyistOrgs).values({
                name: org.name,
                clients: (org.clients || []),
                sectors: org.sectors || null,
                lastActivity: org.lastActivity ? new Date(org.lastActivity) : null,
            });
        }
        upserts++;
    }
    return upserts;
}
