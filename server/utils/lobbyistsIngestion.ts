import { db } from '../db.js';
import { lobbyistOrgs } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function ingestLobbyistsCurated(sample: Array<{ name: string; clients?: string[]; sectors?: string[]; lastActivity?: string }>): Promise<number> {
  let upserts = 0;
  for (const org of sample) {
    const existing = await db.select().from(lobbyistOrgs).where(eq(lobbyistOrgs.name, org.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(lobbyistOrgs).values({
        name: org.name,
        clients: (org.clients || []) as any,
        sectors: org.sectors || null,
        lastActivity: org.lastActivity ? new Date(org.lastActivity) : null,
      });
    }
    upserts++;
  }
  return upserts;
}

/**
 * Ingest lobbyist organizations from CKAN/Open Government datasets when available.
 * Uses a simple package search and maps to `lobbyist_orgs` table.
 * Env overrides:
 * - CKAN_LOBBYISTS_QUERY (default: 'lobbyist registry')
 */
export async function ingestLobbyistsFromCKAN(query?: string): Promise<number> {
  const q = query || process.env.CKAN_LOBBYISTS_QUERY || 'lobbyist registry';
  const url = `https://open.canada.ca/data/api/action/package_search?q=${encodeURIComponent(q)}&rows=50`;
  const res = await fetch(url);
  if (!res.ok) return 0;
  const data = (await res.json().catch(() => null)) as any;
  const results: any[] = data?.result?.results || [];
  let upserts = 0;
  for (const pkg of results) {
    const name = String(pkg.title || pkg.name || '').trim();
    if (!name) continue;
    const existing = await db.select().from(lobbyistOrgs).where(eq(lobbyistOrgs.name, name)).limit(1);
    if (existing.length === 0) {
      const clients = Array.isArray(pkg?.organization?.title) ? pkg.organization.title : [];
      await db.insert(lobbyistOrgs).values({
        name,
        clients: (clients || []) as any,
        sectors: null,
        lastActivity: pkg.metadata_modified ? new Date(pkg.metadata_modified) : null,
      });
    }
    upserts++;
  }
  return upserts;
}


