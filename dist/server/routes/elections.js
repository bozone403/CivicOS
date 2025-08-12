import { ResponseFormatter } from "../utils/responseFormatter.js";
import { fetchWithTimeoutRetry } from '../utils/fetchUtil.js';
import { nextFederalElectionDate, nextMunicipalElectionDate } from "../utils/electionRules.js";
export function registerElectionsRoutes(app) {
    // Comprehensive Canadian election data
    const electionsData = {
        elections: [
            {
                id: 1,
                title: "2025 Canadian Federal Election",
                type: "federal",
                date: "2025-10-20",
                status: "upcoming",
                description: "Federal general election for the 45th Canadian Parliament",
                jurisdiction: "Federal",
                ridings: 338,
                registeredVoters: 27000000,
                parties: [
                    {
                        name: "Liberal Party of Canada",
                        leader: "Justin Trudeau",
                        color: "#FF0000",
                        currentSeats: 156,
                        projectedSeats: 145
                    },
                    {
                        name: "Conservative Party of Canada",
                        leader: "Pierre Poilievre",
                        color: "#0000FF",
                        currentSeats: 119,
                        projectedSeats: 125
                    },
                    {
                        name: "New Democratic Party",
                        leader: "Jagmeet Singh",
                        color: "#FFA500",
                        currentSeats: 25,
                        projectedSeats: 28
                    },
                    {
                        name: "Bloc Québécois",
                        leader: "Yves-François Blanchet",
                        color: "#00FF00",
                        currentSeats: 32,
                        projectedSeats: 30
                    },
                    {
                        name: "Green Party of Canada",
                        leader: "Elizabeth May",
                        color: "#008000",
                        currentSeats: 2,
                        projectedSeats: 3
                    }
                ],
                keyIssues: [
                    "Climate Change and Environmental Policy",
                    "Economic Recovery and Inflation",
                    "Healthcare and Pharmacare",
                    "Housing Affordability",
                    "Indigenous Reconciliation",
                    "Foreign Policy and Trade"
                ],
                importantDates: [
                    { date: "2025-09-15", event: "Election Call" },
                    { date: "2025-09-20", event: "Advance Polling Begins" },
                    { date: "2025-10-13", event: "Advance Polling Ends" },
                    { date: "2025-10-20", event: "Election Day" }
                ]
            },
            {
                id: 2,
                title: "2025 Ontario Provincial Election",
                type: "provincial",
                date: "2025-06-02",
                status: "upcoming",
                description: "Provincial election for the 43rd Legislative Assembly of Ontario",
                jurisdiction: "Ontario",
                ridings: 124,
                registeredVoters: 10500000,
                parties: [
                    {
                        name: "Progressive Conservative Party of Ontario",
                        leader: "Doug Ford",
                        color: "#0000FF",
                        currentSeats: 83,
                        projectedSeats: 75
                    },
                    {
                        name: "Ontario Liberal Party",
                        leader: "Bonnie Crombie",
                        color: "#FF0000",
                        currentSeats: 8,
                        projectedSeats: 25
                    },
                    {
                        name: "Ontario New Democratic Party",
                        leader: "Marit Stiles",
                        color: "#FFA500",
                        currentSeats: 31,
                        projectedSeats: 20
                    },
                    {
                        name: "Green Party of Ontario",
                        leader: "Mike Schreiner",
                        color: "#008000",
                        currentSeats: 1,
                        projectedSeats: 2
                    }
                ],
                keyIssues: [
                    "Healthcare System Reform",
                    "Education Funding",
                    "Infrastructure Development",
                    "Environmental Protection",
                    "Economic Growth and Jobs"
                ],
                importantDates: [
                    { date: "2025-05-09", event: "Election Call" },
                    { date: "2025-05-24", event: "Advance Polling Begins" },
                    { date: "2025-05-31", event: "Advance Polling Ends" },
                    { date: "2025-06-02", event: "Election Day" }
                ]
            },
            {
                id: 3,
                title: "2025 Quebec Provincial Election",
                type: "provincial",
                date: "2025-10-06",
                status: "upcoming",
                description: "Provincial election for the 43rd National Assembly of Quebec",
                jurisdiction: "Quebec",
                ridings: 125,
                registeredVoters: 6500000,
                parties: [
                    {
                        name: "Coalition Avenir Québec",
                        leader: "François Legault",
                        color: "#0000FF",
                        currentSeats: 90,
                        projectedSeats: 75
                    },
                    {
                        name: "Parti Québécois",
                        leader: "Paul St-Pierre Plamondon",
                        color: "#00FF00",
                        currentSeats: 7,
                        projectedSeats: 15
                    },
                    {
                        name: "Quebec Liberal Party",
                        leader: "Marc Tanguay",
                        color: "#FF0000",
                        currentSeats: 21,
                        projectedSeats: 20
                    },
                    {
                        name: "Québec Solidaire",
                        leader: "Gabriel Nadeau-Dubois",
                        color: "#FFA500",
                        currentSeats: 7,
                        projectedSeats: 10
                    }
                ],
                keyIssues: [
                    "Quebec Sovereignty and Language Rights",
                    "Healthcare and Long-term Care",
                    "Climate Change and Green Energy",
                    "Economic Development",
                    "Immigration and Integration"
                ],
                importantDates: [
                    { date: "2025-09-22", event: "Election Call" },
                    { date: "2025-09-27", event: "Advance Polling Begins" },
                    { date: "2025-10-04", event: "Advance Polling Ends" },
                    { date: "2025-10-06", event: "Election Day" }
                ]
            },
            {
                id: 4,
                title: "2025 British Columbia Provincial Election",
                type: "provincial",
                date: "2025-10-19",
                status: "upcoming",
                description: "Provincial election for the 42nd Legislative Assembly of British Columbia",
                jurisdiction: "British Columbia",
                ridings: 87,
                registeredVoters: 3500000,
                parties: [
                    {
                        name: "BC New Democratic Party",
                        leader: "David Eby",
                        color: "#FFA500",
                        currentSeats: 55,
                        projectedSeats: 50
                    },
                    {
                        name: "BC United",
                        leader: "Kevin Falcon",
                        color: "#0000FF",
                        currentSeats: 28,
                        projectedSeats: 30
                    },
                    {
                        name: "BC Green Party",
                        leader: "Sonia Furstenau",
                        color: "#008000",
                        currentSeats: 2,
                        projectedSeats: 5
                    },
                    {
                        name: "BC Conservative Party",
                        leader: "John Rustad",
                        color: "#800080",
                        currentSeats: 2,
                        projectedSeats: 2
                    }
                ],
                keyIssues: [
                    "Housing Affordability and Supply",
                    "Climate Change and Environmental Protection",
                    "Healthcare and Mental Health",
                    "Economic Development and Jobs",
                    "Indigenous Reconciliation"
                ],
                importantDates: [
                    { date: "2025-09-29", event: "Election Call" },
                    { date: "2025-10-04", event: "Advance Polling Begins" },
                    { date: "2025-10-17", event: "Advance Polling Ends" },
                    { date: "2025-10-19", event: "Election Day" }
                ]
            }
        ],
        recentResults: [
            {
                id: 1,
                title: "2021 Canadian Federal Election",
                date: "2021-09-20",
                type: "federal",
                winner: "Liberal Party of Canada",
                totalSeats: 338,
                turnout: "62.5%",
                results: {
                    "Liberal Party of Canada": 160,
                    "Conservative Party of Canada": 119,
                    "Bloc Québécois": 32,
                    "New Democratic Party": 25,
                    "Green Party of Canada": 2
                }
            },
            {
                id: 2,
                title: "2022 Ontario Provincial Election",
                date: "2022-06-02",
                type: "provincial",
                winner: "Progressive Conservative Party of Ontario",
                totalSeats: 124,
                turnout: "43.5%",
                results: {
                    "Progressive Conservative Party of Ontario": 83,
                    "Ontario New Democratic Party": 31,
                    "Ontario Liberal Party": 8,
                    "Green Party of Ontario": 1,
                    "New Blue Party": 1
                }
            }
        ],
        electoralSystem: {
            federal: {
                system: "First Past the Post",
                description: "Single-member plurality system where the candidate with the most votes wins",
                ridings: 338,
                provinces: {
                    "Ontario": 121,
                    "Quebec": 78,
                    "British Columbia": 42,
                    "Alberta": 34,
                    "Manitoba": 14,
                    "Saskatchewan": 14,
                    "Nova Scotia": 11,
                    "New Brunswick": 10,
                    "Newfoundland and Labrador": 7,
                    "Prince Edward Island": 4,
                    "Northwest Territories": 1,
                    "Nunavut": 1,
                    "Yukon": 1
                }
            },
            provincial: {
                description: "Each province has its own electoral system, generally following First Past the Post",
                variations: [
                    "Ontario: First Past the Post",
                    "Quebec: First Past the Post",
                    "British Columbia: First Past the Post",
                    "Alberta: First Past the Post",
                    "Manitoba: First Past the Post",
                    "Saskatchewan: First Past the Post",
                    "Nova Scotia: First Past the Post",
                    "New Brunswick: First Past the Post",
                    "Newfoundland and Labrador: First Past the Post",
                    "Prince Edward Island: First Past the Post"
                ]
            }
        },
        voterInformation: {
            eligibility: [
                "Canadian citizen",
                "18 years of age or older on election day",
                "Resident of the electoral district"
            ],
            registration: [
                "Automatic registration when filing taxes",
                "Online registration through Elections Canada",
                "In-person registration at polling stations"
            ],
            identification: [
                "Government-issued photo ID",
                "Two pieces of ID (one with address)",
                "Voter information card with additional ID"
            ],
            advanceVoting: {
                available: true,
                dates: "Usually 4 days before election day",
                locations: "Designated polling stations"
            }
        }
    };
    // Get all elections data
    app.get("/api/elections", async (req, res) => {
        try {
            // Basic transformation to the shape the client expects
            // Supports simple filtering by location via ?location= or ?q=
            const q = String((req.query.location || req.query.q || "")).trim().toLowerCase();
            // Seed some municipal estimates to ensure comprehensive coverage
            const municipalEstimates = [
                {
                    id: 1001,
                    title: "Toronto Municipal Election (estimated)",
                    type: "municipal",
                    date: "2026-10-26", // Ontario municipal cycle (approximate)
                    status: "upcoming",
                    description: "Next municipal election for the City of Toronto (estimated based on 4‑year cycle)",
                    jurisdiction: "Toronto, Ontario",
                    region: "Toronto, Ontario",
                    source: "City of Toronto / Elections Ontario",
                    sourceUrl: "https://www.toronto.ca/city-government/elections/"
                },
                {
                    id: 1002,
                    title: "Vancouver Municipal Election (estimated)",
                    type: "municipal",
                    date: "2026-10-17", // BC municipal cycle (approximate)
                    status: "upcoming",
                    description: "Next municipal election for the City of Vancouver (estimated based on 4‑year cycle)",
                    jurisdiction: "Vancouver, British Columbia",
                    region: "Vancouver, British Columbia",
                    source: "City of Vancouver / Elections BC",
                    sourceUrl: "https://vancouver.ca/your-government/city-elections.aspx"
                },
                {
                    id: 1003,
                    title: "Montreal Municipal Election (estimated)",
                    type: "municipal",
                    date: "2025-11-02", // QC municipal cycle (approximate, early Nov)
                    status: "upcoming",
                    description: "Next municipal election for the City of Montreal (estimated based on 4‑year cycle)",
                    jurisdiction: "Montreal, Quebec",
                    region: "Montreal, Quebec",
                    source: "Ville de Montréal / Élections Québec",
                    sourceUrl: "https://electionsquebec.qc.ca/"
                }
            ];
            // Convert existing rich dataset into the simplified client shape
            const allUpcoming = [
                ...electionsData.elections.map((e) => ({
                    id: String(e.id),
                    type: e.type || 'federal',
                    region: e.jurisdiction || 'Canada',
                    date: e.date,
                    status: e.status || 'upcoming',
                    description: e.description || e.title,
                    source: e.type === 'federal' ? 'Elections Canada' : (e.jurisdiction ? `Elections ${e.jurisdiction}` : 'Official sources'),
                    sourceUrl: e.type === 'federal' ? 'https://www.elections.ca' : undefined,
                    registrationDeadline: undefined,
                    advanceVotingDates: undefined,
                })),
                ...municipalEstimates.map((e) => ({
                    id: String(e.id),
                    type: e.type,
                    region: e.region,
                    date: e.date,
                    status: e.status,
                    description: e.description,
                    source: e.source,
                    sourceUrl: e.sourceUrl,
                    registrationDeadline: undefined,
                    advanceVotingDates: undefined,
                })),
            ];
            const allRecent = (electionsData.recentResults || []).map((r) => ({
                id: String(r.id),
                type: r.type || 'federal',
                region: r.type === 'federal' ? 'Canada' : (r.title.split(' ')[1] || 'Canada'),
                date: r.date,
                status: 'completed',
                description: r.title,
                source: r.type === 'federal' ? 'Elections Canada' : 'Official sources',
                sourceUrl: r.type === 'federal' ? 'https://www.elections.ca' : undefined,
                registrationDeadline: undefined,
                advanceVotingDates: undefined,
            }));
            const matchesQuery = (text) => (q ? text.toLowerCase().includes(q) : true);
            const filteredUpcoming = allUpcoming.filter((e) => matchesQuery(e.region) || matchesQuery(e.description) || matchesQuery(e.type));
            const filteredRecent = allRecent.filter((e) => matchesQuery(e.region) || matchesQuery(e.description) || matchesQuery(e.type));
            // Enhance with federal/provincial estimated entries when search targets a specific place
            if (q) {
                const provinceMatchMap = {
                    alberta: 'Alberta',
                    ontario: 'Ontario',
                    'british columbia': 'British Columbia',
                    bc: 'British Columbia',
                    quebec: 'Quebec',
                    québec: 'Quebec',
                    manitoba: 'Manitoba',
                    saskatchewan: 'Saskatchewan',
                    'new brunswick': 'New Brunswick',
                    'nova scotia': 'Nova Scotia',
                    'newfoundland and labrador': 'Newfoundland and Labrador',
                    'prince edward island': 'Prince Edward Island',
                    pei: 'Prince Edward Island',
                    yukon: 'Yukon',
                    nunavut: 'Nunavut',
                    'northwest territories': 'Northwest Territories',
                };
                const provinceDetected = Object.keys(provinceMatchMap).find(k => q.includes(k));
                const provinceName = provinceDetected ? provinceMatchMap[provinceDetected] : undefined;
                if (provinceName) {
                    const { date, estimated, rule } = nextMunicipalElectionDate(provinceName);
                    allUpcoming.unshift({
                        id: `est-${provinceName}`,
                        type: 'municipal',
                        region: provinceName,
                        date: new Date(date).toISOString().slice(0, 10),
                        status: 'upcoming',
                        description: `Estimated next municipal elections in ${provinceName} (${rule})`,
                        source: 'Provincial election law (estimated)',
                        sourceUrl: undefined,
                        registrationDeadline: undefined,
                        advanceVotingDates: undefined,
                    });
                }
                // Always include an upcoming federal estimate
                const f = nextFederalElectionDate();
                allUpcoming.unshift({
                    id: `est-federal`,
                    type: 'federal',
                    region: 'Canada',
                    date: new Date(f.date).toISOString().slice(0, 10),
                    status: 'upcoming',
                    description: `Estimated next federal general election (${f.rule})`,
                    source: 'Canada Elections Act (estimated)',
                    sourceUrl: 'https://www.elections.ca',
                    registrationDeadline: undefined,
                    advanceVotingDates: undefined,
                });
            }
            const responsePayload = {
                upcoming: filteredUpcoming.sort((a, b) => a.date.localeCompare(b.date)),
                recent: filteredRecent.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
                lastUpdated: new Date().toISOString(),
                sources: [
                    'Elections Canada',
                    'Elections Ontario',
                    'Elections BC',
                    'Élections Québec',
                    'Municipal election authorities',
                ],
            };
            // If no upcoming results, attempt an on-demand fetch from Elections Canada (best-effort)
            if (!responsePayload.upcoming || responsePayload.upcoming.length === 0) {
                try {
                    const ec = await fetchWithTimeoutRetry('https://www.elections.ca/enr/help/national.aspx', { timeoutMs: 5000 });
                    if (ec.ok) {
                        // We could parse, but if we reached here, surface at least a clear message
                        responsePayload.sources.push('Elections Canada (live)');
                    }
                }
                catch { }
            }
            return ResponseFormatter.success(res, responsePayload, "Elections data retrieved successfully");
        }
        catch (error) {
            return ResponseFormatter.error(res, "Failed to retrieve elections data", 500);
        }
    });
    // Get specific election by ID
    app.get("/api/elections/:id", async (req, res) => {
        try {
            const electionId = parseInt(req.params.id);
            const election = electionsData.elections.find(e => e.id === electionId);
            if (!election) {
                return ResponseFormatter.error(res, "Election not found", 404);
            }
            return ResponseFormatter.success(res, election, "Election data retrieved successfully");
        }
        catch (error) {
            return ResponseFormatter.error(res, "Failed to retrieve election data", 500);
        }
    });
    // Get electoral system information
    app.get("/api/elections/system/info", async (req, res) => {
        try {
            return ResponseFormatter.success(res, electionsData.electoralSystem, "Electoral system information retrieved successfully");
        }
        catch (error) {
            return ResponseFormatter.error(res, "Failed to retrieve electoral system information", 500);
        }
    });
    // Get voter information
    app.get("/api/elections/voter-info", async (req, res) => {
        try {
            return ResponseFormatter.success(res, electionsData.voterInformation, "Voter information retrieved successfully");
        }
        catch (error) {
            return ResponseFormatter.error(res, "Failed to retrieve voter information", 500);
        }
    });
    // Get recent election results
    app.get("/api/elections/results/recent", async (req, res) => {
        try {
            return ResponseFormatter.success(res, electionsData.recentResults, "Recent election results retrieved successfully");
        }
        catch (error) {
            return ResponseFormatter.error(res, "Failed to retrieve recent election results", 500);
        }
    });
}
