import { db } from './db.js';
import { electoralCandidates, electoralVotes } from '../shared/schema.js';
import { eq, count, desc, sql, and } from 'drizzle-orm';
// Current Canadian Party Leaders and Key Political Figures
const CURRENT_CANADIAN_LEADERS = [
    {
        name: "Justin Trudeau",
        party: "Liberal Party of Canada",
        position: "Prime Minister",
        jurisdiction: "Federal",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Justin_Trudeau_2019.jpg/220px-Justin_Trudeau_2019.jpg",
        bio: "Justin Trudeau is the 23rd Prime Minister of Canada, serving since 2015. He leads the Liberal Party of Canada and has focused on climate action, reconciliation with Indigenous peoples, and social progress.",
        keyPolicies: [
            "Climate action and carbon pricing",
            "Reconciliation with Indigenous peoples",
            "Universal pharmacare",
            "Child care support",
            "Immigration and diversity"
        ],
        trustScore: 45.2
    },
    {
        name: "Pierre Poilievre",
        party: "Conservative Party of Canada",
        position: "Leader of the Opposition",
        jurisdiction: "Federal",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Pierre_Poilievre_2022.jpg/220px-Pierre_Poilievre_2022.jpg",
        bio: "Pierre Poilievre is the Leader of the Opposition and Conservative Party leader since 2022. He focuses on economic issues, reducing government spending, and addressing inflation.",
        keyPolicies: [
            "Fiscal responsibility and debt reduction",
            "Lower taxes and deregulation",
            "Energy sector support",
            "Law and order",
            "Housing affordability"
        ],
        trustScore: 52.8
    },
    {
        name: "Jagmeet Singh",
        party: "New Democratic Party",
        position: "NDP Leader",
        jurisdiction: "Federal",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Jagmeet_Singh_2019.jpg/220px-Jagmeet_Singh_2019.jpg",
        bio: "Jagmeet Singh leads the New Democratic Party and has been a Member of Parliament since 2019. He advocates for social justice, universal healthcare, and workers' rights.",
        keyPolicies: [
            "Universal pharmacare and dental care",
            "Climate justice and green jobs",
            "Affordable housing",
            "Workers' rights and unions",
            "Racial and social justice"
        ],
        trustScore: 48.7
    },
    {
        name: "Yves-François Blanchet",
        party: "Bloc Québécois",
        position: "Bloc Leader",
        jurisdiction: "Federal",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Yves-Fran%C3%A7ois_Blanchet_2019.jpg/220px-Yves-Fran%C3%A7ois_Blanchet_2019.jpg",
        bio: "Yves-François Blanchet leads the Bloc Québécois, advocating for Quebec's interests and autonomy within the Canadian federation.",
        keyPolicies: [
            "Quebec autonomy and interests",
            "French language protection",
            "Quebec cultural identity",
            "Provincial jurisdiction respect",
            "Quebec-specific policies"
        ],
        trustScore: 41.3
    },
    {
        name: "Elizabeth May",
        party: "Green Party of Canada",
        position: "Green Party Co-Leader",
        jurisdiction: "Federal",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Elizabeth_May_2019.jpg/220px-Elizabeth_May_2019.jpg",
        bio: "Elizabeth May is a co-leader of the Green Party of Canada and has been a strong advocate for environmental protection and climate action.",
        keyPolicies: [
            "Climate emergency action",
            "Renewable energy transition",
            "Environmental protection",
            "Social justice",
            "Sustainable economy"
        ],
        trustScore: 55.1
    },
    {
        name: "Maxime Bernier",
        party: "People's Party of Canada",
        position: "PPC Leader",
        jurisdiction: "Federal",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Maxime_Bernier_2019.jpg/220px-Maxime_Bernier_2019.jpg",
        bio: "Maxime Bernier founded and leads the People's Party of Canada, advocating for smaller government, free markets, and Canadian sovereignty.",
        keyPolicies: [
            "Smaller government",
            "Free market economics",
            "Canadian sovereignty",
            "Immigration reform",
            "Fiscal conservatism"
        ],
        trustScore: 38.9
    }
];
export class ElectionDataService {
    /**
     * Populate electoral candidates with current Canadian party leaders
     */
    static async populateElectoralCandidates() {
        try {
            // console.log removed for production
            // Check if candidates already exist
            const existingCandidates = await db.select().from(electoralCandidates);
            if (existingCandidates.length > 0) {
                // console.log removed for production
                return existingCandidates;
            }
            // Insert current leaders
            const insertedCandidates = await Promise.all(CURRENT_CANADIAN_LEADERS.map(async (leader) => {
                const [candidate] = await db.insert(electoralCandidates).values({
                    name: leader.name,
                    party: leader.party,
                    bio: leader.bio
                }).returning();
                return candidate;
            }));
            // console.log removed for production
            return insertedCandidates;
        }
        catch (error) {
            // console.error removed for production
            throw error;
        }
    }
    /**
     * Get electoral candidates with voting statistics
     */
    static async getElectoralCandidatesWithStats() {
        try {
            const candidates = await db.select().from(electoralCandidates).orderBy(electoralCandidates.name);
            // Get voting statistics for each candidate
            const candidatesWithStats = await Promise.all(candidates.map(async (candidate) => {
                // Get vote counts by type
                const preferenceVotes = await db
                    .select({ count: count() })
                    .from(electoralVotes)
                    .where(and(eq(electoralVotes.candidateId, candidate.id), eq(electoralVotes.voteType, 'preference')));
                const supportVotes = await db
                    .select({ count: count() })
                    .from(electoralVotes)
                    .where(and(eq(electoralVotes.candidateId, candidate.id), eq(electoralVotes.voteType, 'support')));
                const opposeVotes = await db
                    .select({ count: count() })
                    .from(electoralVotes)
                    .where(and(eq(electoralVotes.candidateId, candidate.id), eq(electoralVotes.voteType, 'oppose')));
                const totalVotes = (preferenceVotes[0]?.count || 0) + (supportVotes[0]?.count || 0) + (opposeVotes[0]?.count || 0);
                return {
                    ...candidate,
                    voteStats: {
                        preference: preferenceVotes[0]?.count || 0,
                        support: supportVotes[0]?.count || 0,
                        oppose: opposeVotes[0]?.count || 0,
                        total: totalVotes
                    }
                };
            }));
            return candidatesWithStats;
        }
        catch (error) {
            // console.error removed for production
            throw error;
        }
    }
    /**
     * Get electoral voting results and statistics
     */
    static async getElectoralResults() {
        try {
            // Get total votes across all candidates
            const [totalVotesResult] = await db
                .select({ total: count() })
                .from(electoralVotes);
            const totalVotes = totalVotesResult?.total || 0;
            // Get votes by type
            const [preferenceTotal] = await db
                .select({ count: count() })
                .from(electoralVotes)
                .where(eq(electoralVotes.voteType, 'preference'));
            const [supportTotal] = await db
                .select({ count: count() })
                .from(electoralVotes)
                .where(eq(electoralVotes.voteType, 'support'));
            const [opposeTotal] = await db
                .select({ count: count() })
                .from(electoralVotes)
                .where(eq(electoralVotes.voteType, 'oppose'));
            // Get top candidates by votes
            const topCandidates = await db
                .select({
                candidateId: electoralVotes.candidateId,
                candidateName: electoralCandidates.name,
                party: electoralCandidates.party,
                totalVotes: count()
            })
                .from(electoralVotes)
                .leftJoin(electoralCandidates, eq(electoralVotes.candidateId, electoralCandidates.id))
                .groupBy(electoralVotes.candidateId, electoralCandidates.name, electoralCandidates.party)
                .orderBy(desc(count()))
                .limit(5);
            return {
                totalVotes,
                voteBreakdown: {
                    preference: preferenceTotal?.count || 0,
                    support: supportTotal?.count || 0,
                    oppose: opposeTotal?.count || 0
                },
                topCandidates,
                lastUpdated: new Date().toISOString()
            };
        }
        catch (error) {
            // console.error removed for production
            throw error;
        }
    }
    /**
     * Get user's electoral voting history
     */
    static async getUserElectoralHistory(userId) {
        try {
            const userVotes = await db
                .select({
                id: electoralVotes.id,
                candidateId: electoralVotes.candidateId,
                candidateName: electoralCandidates.name,
                party: electoralCandidates.party,
                voteType: electoralVotes.voteType,
                reasoning: electoralVotes.reasoning,
                timestamp: electoralVotes.timestamp
            })
                .from(electoralVotes)
                .leftJoin(electoralCandidates, eq(electoralVotes.candidateId, electoralCandidates.id))
                .where(eq(electoralVotes.userId, userId))
                .orderBy(desc(electoralVotes.timestamp));
            return userVotes;
        }
        catch (error) {
            // console.error removed for production
            throw error;
        }
    }
    /**
     * Get real-time electoral voting trends
     */
    static async getElectoralTrends() {
        try {
            // Get votes in the last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const recentVotes = await db
                .select({
                candidateId: electoralVotes.candidateId,
                candidateName: electoralCandidates.name,
                party: electoralCandidates.party,
                voteType: electoralVotes.voteType,
                timestamp: electoralVotes.timestamp
            })
                .from(electoralVotes)
                .leftJoin(electoralCandidates, eq(electoralVotes.candidateId, electoralCandidates.id))
                .where(sql `${electoralVotes.timestamp} >= ${yesterday}`)
                .orderBy(desc(electoralVotes.timestamp));
            // Calculate trends
            const trends = recentVotes.reduce((acc, vote) => {
                const key = `${vote.candidateName}_${vote.voteType}`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            return {
                recentVotes: recentVotes.length,
                trends,
                lastUpdated: new Date().toISOString()
            };
        }
        catch (error) {
            // console.error removed for production
            throw error;
        }
    }
}
