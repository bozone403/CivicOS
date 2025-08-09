import { db } from '../db.js';
import { procurementContracts } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

type CkanPackage = {
  title?: string;
  organization?: { title?: string };
  metadata_modified?: string;
  resources?: Array<{ url?: string; format?: string; name?: string }>;
  id?: string;
};

export async function ingestProcurementFromCKAN(query: string = 'contract awards'): Promise<number> {
  const url = `https://open.canada.ca/data/api/action/package_search?q=${encodeURIComponent(query)}&rows=50`;
  const res = await fetch(url);
  if (!res.ok) return 0;
  const data = await res.json().catch(() => null) as any;
  const results: CkanPackage[] = data?.result?.results || [];
  let inserted = 0;
  for (const pkg of results) {
    const ref = pkg.id || `${pkg.title}-${pkg.metadata_modified}`;
    if (!ref) continue;
    const existing = await db.select().from(procurementContracts).where(eq(procurementContracts.reference, ref)).limit(1);
    if (existing.length > 0) continue;
    const urlRes = pkg.resources?.find(r => (r.format || '').toLowerCase().includes('html'))?.url || pkg.resources?.[0]?.url || null;
    await db.insert(procurementContracts).values({
      reference: ref,
      supplier: pkg.title?.slice(0, 255) || null,
      department: pkg.organization?.title?.slice(0, 255) || null,
      value: null,
      awardedOn: pkg.metadata_modified ? new Date(pkg.metadata_modified) : null,
      url: urlRes || null,
    });
    inserted++;
  }
  return inserted;
}


