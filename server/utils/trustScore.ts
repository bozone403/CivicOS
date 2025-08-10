import { db } from '../db.js';
import { politicians, billRollcallRecords, billRollcalls, campaignFinance, politicianTruthTracking } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export async function computeTrustScore(politicianId: number): Promise<number> {
  // Voting consistency: favor clear, non-flip-flopping behavior
  const votes = await db.select().from(billRollcallRecords).where(eq(billRollcallRecords.memberId as any, (await getParliamentMemberId(politicianId)) as any));
  const totalVotes = votes.length;
  const yes = votes.filter(v => (v as any).decision === 'yes').length;
  const no = votes.filter(v => (v as any).decision === 'no').length;
  const abstain = votes.filter(v => (v as any).decision === 'abstain').length;
  const paired = votes.filter(v => (v as any).decision === 'paired').length;
  const voteConsistencyScore = totalVotes > 0 ? (1 - (abstain + paired) / totalVotes) * 100 : 50;

  // Finance: penalize high spending if available (placeholder heuristic)
  const fin = await db.select().from(campaignFinance).where(eq(campaignFinance.politicianId, politicianId));
  const spendPenalty = fin && fin.length ? Math.min(20, (Number((fin[0] as any).amount) || 0) / 10000) : 0;

  // Truth tracking: penalize low truth score
  const [truth] = await db.select().from(politicianTruthTracking).where(eq(politicianTruthTracking.politicianId, politicianId));
  const truthScoreComponent = truth ? Math.max(0, 100 - Number((truth as any).truthScore || 0) * 20) : 10;

  // Combine with weights; clamp 0..100
  const base = 60;
  const combined = base + (voteConsistencyScore - 50) * 0.6 - spendPenalty - truthScoreComponent * 0.2;
  return Math.max(0, Math.min(100, Math.round(combined)));
}

async function getParliamentMemberId(politicianId: number): Promise<string | null> {
  const [p] = await db.select().from(politicians).where(eq(politicians.id, politicianId));
  return p ? ((p as any).parliamentMemberId as string | null) : null;
}


