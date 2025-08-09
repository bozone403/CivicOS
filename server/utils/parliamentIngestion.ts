import * as cheerio from 'cheerio';
import { db } from '../db.js';
import { parliamentMembers, billRollcalls, billRollcallRecords, bills, politicians } from '../../shared/schema.js';
import { eq, inArray } from 'drizzle-orm';

export async function ingestParliamentMembers(): Promise<number> {
  // Placeholder: fetch Our Commons JSON if available; fallback scrape minimal list
  const url = 'https://www.ourcommons.ca/members/en/search?output=JSON';
  const res = await fetch(url);
  if (!res.ok) return 0;
  const data = await res.json();
  let inserted = 0;
  for (const m of data?.Members || []) {
    const id = String(m.PersonId || m.MemberId || m.Id || m.Url || m.Name);
    const name = m.Name || m.EnglishName || `${m.FirstName || ''} ${m.LastName || ''}`.trim();
    const riding = m.ConstituencyName || m.Riding || m.EnglishConstituency;
    const party = m.Party || m.CaucusShortName || m.PartyShortName;
    if (!id || !name) continue;
    const existing = await db.select().from(parliamentMembers).where(eq(parliamentMembers.memberId, id)).limit(1);
    if (existing.length === 0) {
      await db.insert(parliamentMembers).values({ memberId: id, name, constituency: riding, party, active: true });
      inserted++;
    }
  }
  return inserted;
}

/**
 * Ingest recent House of Commons roll-call votes and member decisions.
 *
 * Primary source (configurable via env): OpenParliament votes JSON, which mirrors official divisions.
 * Fallbacks: attempt to parse reasonably common JSON shapes.
 *
 * Env overrides:
 * - OPENPARLIAMENT_VOTES_URL (list endpoint), e.g. https://api.openparliament.ca/votes/?format=json&limit=10
 * - OPENPARLIAMENT_VOTE_DETAIL_URL (detail endpoint pattern with :id placeholder), e.g. https://api.openparliament.ca/votes/:id/?format=json
 */
export async function ingestBillRollcallsForCurrentSession(limit: number = 10): Promise<{ rollcalls: number; records: number }> {
  let rollcalls = 0;
  let records = 0;

  const listUrl =
    process.env.OPENPARLIAMENT_VOTES_URL || `https://api.openparliament.ca/votes/?format=json&limit=${limit}`;

  try {
    const listRes = await fetch(listUrl);
    if (!listRes.ok) {
      return { rollcalls, records };
    }
    const listJson: any = await listRes.json();

    const items: any[] =
      listJson?.results || listJson?.objects || listJson?.votes || listJson?.data || listJson || [];
    if (!Array.isArray(items)) return { rollcalls, records };

    for (const item of items) {
      try {
        const voteId = String(
          item?.id || item?.pk || item?.vote_id || item?.number || item?.url?.split('/').filter(Boolean).pop() || ''
        );
        const billNumber = String(
          item?.bill?.number || item?.bill_number || item?.related?.bill?.number || item?.label || item?.short_title ||
            item?.title || ''
        );
        const voteNumber = Number(item?.number || item?.vote_number || item?.division_number || item?.sequence || 0) || null;
        const parliament = Number(
          item?.parliament || item?.parliament_number || item?.session?.parliament_number || item?.session_parliament
        );
        const session = String(item?.session?.code || item?.session || item?.session_number || item?.period || '');
        const result = String(item?.result || item?.result_text || item?.outcome || item?.decision || '') || null;
        const dateTimeRaw = item?.date || item?.recorded_on || item?.time || item?.datetime || item?.recorded_at;
        const dateTime = dateTimeRaw ? new Date(dateTimeRaw) : new Date();

        if (!billNumber && !voteId) {
          // Not enough identifying info
          continue;
        }

        // Insert rollcall (best-effort dedupe by billNumber + voteNumber when available)
        let rollcallId: number | null = null;
        if (billNumber) {
          const existing = await db.select().from(billRollcalls).where(eq(billRollcalls.billNumber, String(billNumber))).limit(1);
          if (existing.length > 0 && (existing[0] as any).voteNumber === voteNumber) {
            rollcallId = (existing[0] as any).id as number;
          }
        }

        if (!rollcallId) {
          const [rc] = await db
            .insert(billRollcalls)
            .values({
              parliament: isFinite(parliament) ? parliament : null,
              session: session || null,
              billNumber: billNumber || (voteId ? `VOTE-${voteId}` : 'UNKNOWN'),
              voteNumber: voteNumber,
              result: result || null,
              dateTime,
            })
            .returning();
          rollcallId = (rc as any).id as number;
          rollcalls++;
        }

        // Try to fetch detailed voter positions
        const detailPattern = process.env.OPENPARLIAMENT_VOTE_DETAIL_URL || 'https://api.openparliament.ca/votes/:id/?format=json';
        const detailUrl = voteId ? detailPattern.replace(':id', encodeURIComponent(voteId)) : null;

        let voterDetails: any = null;
        if (detailUrl) {
          try {
            const detailRes = await fetch(detailUrl);
            if (detailRes.ok) {
              voterDetails = await detailRes.json();
            }
          } catch {}
        }

        const decisionBuckets: Array<{ decision: string; members: any[] }> = [];
        if (voterDetails) {
          const yes = voterDetails?.yea || voterDetails?.yeas || voterDetails?.yays || voterDetails?.votes_yes || [];
          const no = voterDetails?.nay || voterDetails?.nays || voterDetails?.votes_no || [];
          const paired = voterDetails?.paired || voterDetails?.votes_paired || [];
          const abstain = voterDetails?.abstain || voterDetails?.abstentions || voterDetails?.votes_abstain || [];
          if (Array.isArray(yes) && yes.length) decisionBuckets.push({ decision: 'yes', members: yes });
          if (Array.isArray(no) && no.length) decisionBuckets.push({ decision: 'no', members: no });
          if (Array.isArray(paired) && paired.length) decisionBuckets.push({ decision: 'paired', members: paired });
          if (Array.isArray(abstain) && abstain.length) decisionBuckets.push({ decision: 'abstain', members: abstain });
        }

        if (decisionBuckets.length === 0) {
          // Some APIs return consolidated voters array with decision per row
          const voters = voterDetails?.voters || voterDetails?.votes || [];
          if (Array.isArray(voters)) {
            for (const v of voters) {
              const name = v?.name || v?.person_name || v?.mp || v?.member || v?.voter || '';
              const memberId = String(v?.id || v?.member_id || v?.person_id || name);
              const decision = String(
                v?.decision || v?.vote || v?.position || v?.result || v?.option || ''
              ).toLowerCase();
              const party = v?.party || v?.party_short || v?.caucus || null;
              if (!memberId) continue;
              await db.insert(billRollcallRecords).values({
                rollcallId: rollcallId,
                memberId,
                decision,
                party: party || null,
              });
              records++;
            }
            continue;
          }
        }

        // Structured buckets case
        for (const bucket of decisionBuckets) {
          for (const member of bucket.members) {
            const name = member?.name || member?.person_name || member?.mp || member?.member || member?.voter || '';
            const memberId = String(member?.id || member?.member_id || member?.person_id || name);
            const party = member?.party || member?.party_short || member?.caucus || null;
            if (!memberId) continue;
            await db.insert(billRollcallRecords).values({
              rollcallId: rollcallId,
              memberId,
              decision: bucket.decision,
              party: party || null,
            });
            records++;
          }
        }
      } catch {
        // Skip malformed items safely
        continue;
      }
    }
  } catch {
    // Silent fail to avoid breaking admin refresh; counters stay 0
  }

  return { rollcalls, records };
}


