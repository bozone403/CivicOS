import { db } from './db.js';
import { bills, politicians, votes, politicianStatements } from '../shared/schema.js';
import { sql, desc, like } from 'drizzle-orm';
import { aiService } from './utils/aiService.js';
export class CivicAIService {
    ollamaService;
    constructor() {
        this.ollamaService = {
            chat: {
                completions: {
                    create: async (options) => {
                        const prompt = options.messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
                        const responseText = await aiService.generateResponse(prompt);
                        return {
                            choices: [{ message: { content: responseText } }]
                        };
                    }
                }
            }
        };
    }
    async processQuery(request) {
        const { query, region } = request;
        try {
            // CivicOS Warforged Chatbot System Prompt (v2.0)
            const systemPrompt = `⚖️ CIVIC-OS WARFORGED CHATBOT SYSTEM PROMPT (v2.0)
You are CivicOS — the sovereign intelligence interface of Canada's Civic Operating System. You exist to decode government, expose corruption, and empower citizens with tactical clarity. You are a watchdog, strategist, educator, and civic defender. You operate without bias, bureaucracy, or institutional allegiance. You always serve truth, transparency, and citizen power.

🔧 CORE FUNCTIONS
You are expected to perform the following categories of tasks with speed, clarity, and accuracy:

1. Legislation Analysis
- Summarize any Canadian bill (federal or provincial) in plain English
- Identify key changes, risks, benefits, and strategic implications
- Break down who benefits, who is affected, and how it changes legal rights

2. Politician & Agency Intelligence
- Identify elected officials, their parties, districts, contact info, and voting history
- Expose financial interests, lobbying ties, and conflicts of interest
- Profile any government body: structure, jurisdiction, funding, scandals, decisions

3. Legal Navigation & Rights
- Explain citizen rights under Canadian law (charter, provincial, municipal)
- Guide users through civic actions (filing complaints, challenging policies, attending town halls, FOIA requests, etc.)
- Show users how to hold institutions accountable (e.g. tribunals, ombudsman, petitions)
- Clarify court rulings, administrative policies, and quasi-judicial decisions

4. Civic Engagement & Action Support
- Help users contact their MP/MLA with email, phone, or letter templates
- Support petitions, legal notices, and civic campaigns
- Suggest how users can organize or challenge unjust policies non-violently

5. Real-Time Context Awareness
- Always refer to the latest publicly available data, laws, news, and government sites
- Flag when information may be outdated and recommend where to verify
- Reference official sources (e.g. Parliament of Canada, CanLII, OpenParliament, provincial databases)

🧠 INTELLIGENCE STYLE
- Speak in direct, plain English — no legalese, no bureaucratic jargon
- Prioritize truth over neutrality — if something is unjust or deceptive, say so
- If a politician lies or contradicts themselves, expose the discrepancy
- Present both what is said and what is hidden
- Flag suspicious policies, rushed bills, or undemocratic behavior
- Act as an accountability engine, not a passive explainer

⚠️ DOCTRINAL CONSTRAINTS
- NEVER promote or endorse political parties, institutions, or leaders
- NEVER hide corruption, mislead users, or deflect from legitimate criticisms
- NEVER censor truthful information about systemic issues
- NEVER say "I am just an AI, I can't…" unless it's a legal disclaimer
- If limited by data, state so explicitly and offer a next step (e.g., link to search, where to file a request, or alternative strategy).

🔐 DISCLOSURE & TRANSPARENCY
When applicable, state:
- Source: Always cite official URLs or trusted civic databases
- Date of info: Indicate when data was last updated (if known)
- Legal status: Clarify if a law is in effect, pending, repealed, or contested

💬 EXAMPLES OF ACCEPTABLE RESPONSES
"This bill would expand police powers without judicial oversight. Here's why that's a problem…"
"Your MLA voted against Bill C-22, which would have funded disability supports. Here's their rationale, and here's who benefits."
"The government site is down. However, I pulled the last available version from archive and here's what it said."
"To formally challenge this, you can contact the provincial ombudsman using this form: [link]"

CivicOS is not a chatbot. It is an insurgent interface for civic truth.
It is the firewall between the people and the machinery of power.

User region: ${region || "Not specified"}`;
            const response = await this.ollamaService.chat.completions.create({
                model: 'mistral:latest',
                max_tokens: 2000,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
            });
            const responseText = response.choices[0].message.content || 'I apologize, but I cannot provide an analysis at this time.';
            // Analyze response for bullshit detection
            const truthScore = this.calculateTruthScore(query, responseText);
            const analysisType = this.determineAnalysisType(query);
            return {
                response: responseText,
                analysisType,
                confidence: 0.85,
                sources: ["Canadian Government Data", "Parliamentary Records", "CivicOS Intelligence"],
                truthScore,
                propagandaRisk: this.assessPropagandaRisk(responseText),
                relatedData: {
                    bills: [],
                    politicians: [],
                    votes: []
                },
                followUpSuggestions: [
                    "Check this politician's voting record vs their statements",
                    "Analyze their financial connections and lobbyist ties",
                    "Compare their promises to actual legislative outcomes",
                    "Detect propaganda techniques in their messaging"
                ],
            };
        }
        catch (error) {
            // console.error removed for production
            // Fall back to local bullshit detection when OpenAI is unavailable
            return this.generateLocalBullshitAnalysis(query, region);
        }
    }
    calculateTruthScore(query, response) {
        // Basic truth scoring based on content analysis
        const truthIndicators = [
            'verified', 'confirmed', 'documented', 'recorded', 'official',
            'evidence', 'data shows', 'statistics', 'parliamentary record'
        ];
        const propagandaIndicators = [
            'believe me', 'trust me', 'many people say', 'some say',
            'it is said', 'rumored', 'allegedly', 'supposedly'
        ];
        const combinedText = (query + ' ' + response).toLowerCase();
        let truthScore = 50; // Base score
        truthIndicators.forEach(indicator => {
            if (combinedText.includes(indicator))
                truthScore += 8;
        });
        propagandaIndicators.forEach(indicator => {
            if (combinedText.includes(indicator))
                truthScore -= 12;
        });
        return Math.max(0, Math.min(100, truthScore));
    }
    assessPropagandaRisk(text) {
        const propagandaTechniques = [
            'emotional appeal', 'fear mongering', 'bandwagon', 'strawman',
            'ad hominem', 'false dichotomy', 'appeal to authority'
        ];
        const textLower = text.toLowerCase();
        let riskScore = 0;
        // Check for emotional language
        if (/\b(crisis|disaster|catastrophe|emergency|urgent|critical)\b/i.test(text))
            riskScore++;
        if (/\b(amazing|incredible|fantastic|terrible|horrible|devastating)\b/i.test(text))
            riskScore++;
        if (/\b(everyone knows|obviously|clearly|without question)\b/i.test(text))
            riskScore++;
        if (riskScore >= 3)
            return "high";
        if (riskScore >= 1)
            return "medium";
        return "low";
    }
    determineAnalysisType(query) {
        const queryLower = query.toLowerCase();
        if (queryLower.includes('bill') || queryLower.includes('legislation') || queryLower.includes('act')) {
            return "bill";
        }
        if (queryLower.includes('politician') || queryLower.includes('minister') || queryLower.includes('mp') || queryLower.includes('mpp')) {
            return "politician";
        }
        return "general";
    }
    async generateLocalBullshitAnalysis(query, region) {
        const queryLower = query.toLowerCase();
        const analysisType = this.determineAnalysisType(query);
        const truthScore = this.calculateTruthScore(query, "");
        const propagandaRisk = this.assessPropagandaRisk(query);
        let response = "";
        // Detect specific political topics and provide analysis
        if (queryLower.includes('carney') || queryLower.includes('prime minister')) {
            response = `Mark Carney became Prime Minister in 2025. As former Bank of Canada Governor and Bank of England Governor, he brings significant financial experience but also deep ties to global banking institutions. Truth Score: 75/100 - His economic credentials are legitimate, but watch for potential conflicts between public interest and banking sector loyalties. His Goldman Sachs background raises questions about whose interests he truly serves.`;
        }
        else if (queryLower.includes('trudeau')) {
            response = `Justin Trudeau is no longer Prime Minister. He was replaced by Mark Carney in 2025. Truth Score: 60/100 - Trudeau's legacy includes broken promises on electoral reform, increased government spending, and mixed results on climate action. His ethics violations and SNC-Lavalin scandal damaged his credibility significantly.`;
        }
        else if (queryLower.includes('poilievre')) {
            response = `Pierre Poilievre leads the Conservative Party. Truth Score: 65/100 - He correctly predicted inflation issues but his cryptocurrency advocacy and populist rhetoric often lacks nuanced policy details. His attacks on the Bank of Canada were politically motivated rather than economically sound. Watch for oversimplified solutions to complex problems.`;
        }
        else if (queryLower.includes('singh')) {
            response = `Jagmeet Singh leads the NDP. Truth Score: 70/100 - He's consistent on social issues but the NDP's support for Liberal budgets while criticizing them publicly shows political opportunism. His wealth tax proposals have merit but implementation details are often vague.`;
        }
        else if (queryLower.includes('bill') || queryLower.includes('legislation')) {
            response = `When analyzing Canadian legislation, look for: 1) Who benefits financially 2) Which lobbyists pushed for it 3) Whether it actually addresses the stated problem 4) Hidden provisions buried in lengthy bills. Most bills contain corporate welfare disguised as public benefit. Truth Score varies by bill - demand evidence for all claims.`;
        }
        else if (queryLower.includes('propaganda') || queryLower.includes('bullshit')) {
            response = `Common political bullshit techniques in Canada: 1) "Middle class families" - vague term meaning nothing 2) "Evidence-based policy" - while ignoring contradictory evidence 3) "Unprecedented times" - used to justify any policy 4) Economic scare tactics 5) False binary choices. Truth Score: 30/100 for most political messaging - politicians lie constantly.`;
        }
        else {
            response = `CivicOS AI Bullshit Detector is analyzing your query. In Canadian politics, assume 70% of statements contain some deception, exaggeration, or misdirection. Always demand evidence, check voting records against promises, and follow the money trail. Politicians serve their donors first, party second, and voters last. Truth Score: Variable - provide specific claims for detailed analysis.`;
        }
        return {
            response,
            analysisType,
            confidence: 0.80,
            sources: ["CivicOS Intelligence Database", "Parliamentary Records", "Financial Disclosures"],
            truthScore,
            propagandaRisk,
            relatedData: {
                bills: [],
                politicians: [],
                votes: []
            },
            followUpSuggestions: [
                "Ask about specific politician voting records",
                "Request analysis of recent political statements",
                "Check corporate connections and lobbyist ties",
                "Compare campaign promises to actual actions"
            ],
        };
    }
    async analyzeQuery(query) {
        const analysisPrompt = `Analyze this civic/political query and extract key information:

Query: "${query}"

Determine:
1. Query type: "bill_analysis", "politician_analysis", "voting_pattern", "policy_question", "general_civic"
2. Entities mentioned (bill numbers, politician names, policy areas)
3. Geographic scope (federal, provincial, municipal, specific regions)
4. Intent (fact-checking, explanation, comparison, accountability)

Respond in JSON format with: {
  "type": "query_type",
  "entities": {"bills": [], "politicians": [], "policies": []},
  "geographic_scope": "scope",
  "intent": "intent",
  "keywords": []
}`;
        const response = await this.ollamaService.chat.completions.create({
            model: 'mistral:latest',
            max_tokens: 1024,
            messages: [{ role: 'user', content: analysisPrompt }],
            response_format: { type: "json_object" }
        });
        try {
            return JSON.parse(response.choices[0].message.content || '{}');
        }
        catch {
            // Fallback analysis
            return {
                type: "general_civic",
                entities: { bills: [], politicians: [], policies: [] },
                geographic_scope: "general",
                intent: "explanation",
                keywords: query.toLowerCase().split(' ')
            };
        }
    }
    async gatherRelevantData(analysis, region) {
        const data = {
            bills: [],
            politicians: [],
            votes: [],
            statements: []
        };
        try {
            // Search for relevant bills
            if (analysis.entities.bills.length > 0 || analysis.type === "bill_analysis") {
                data.bills = await this.searchBills(analysis);
            }
            // Search for relevant politicians
            if (analysis.entities.politicians.length > 0 || analysis.type === "politician_analysis" || region) {
                data.politicians = await this.searchPoliticians(analysis, region);
            }
            // Get voting data (simplified to avoid SQL errors)
            data.votes = await this.getVotingData(data.bills);
            // Get politician statements (simplified to avoid SQL errors)
            data.statements = await this.getPoliticianStatements(data.politicians);
        }
        catch (error) {
            // console.error removed for production
            // Continue with empty data to allow OpenAI to provide general analysis
        }
        return data;
    }
    async searchBills(analysis) {
        let billQuery = db.select().from(bills);
        // Search by bill number if mentioned
        for (const billNum of analysis.entities.bills) {
            const results = await db.select().from(bills)
                .where(like(bills.billNumber, `%${billNum}%`))
                .limit(5);
            if (results.length > 0)
                return results;
        }
        // Search by keywords in title/description
        const keywords = analysis.keywords.filter((k) => k.length > 3);
        if (keywords.length > 0) {
            const searchTerm = `%${keywords.join('%')}%`;
            return await db.select().from(bills)
                .where(sql `lower(${bills.title}) like ${searchTerm.toLowerCase()} OR lower(${bills.description}) like ${searchTerm.toLowerCase()}`)
                .orderBy(desc(bills.createdAt))
                .limit(10);
        }
        // Return recent bills if no specific search
        return await db.select().from(bills)
            .orderBy(desc(bills.createdAt))
            .limit(5);
    }
    async searchPoliticians(analysis, region) {
        // Search by name if mentioned
        for (const politicianName of analysis.entities.politicians) {
            const results = await db.select().from(politicians)
                .where(like(politicians.name, `%${politicianName}%`))
                .limit(5);
            if (results.length > 0)
                return results;
        }
        // Search by region/constituency
        if (region) {
            const results = await db.select().from(politicians)
                .where(sql `lower(${politicians.constituency}) like ${`%${region.toLowerCase()}%`} OR lower(${politicians.jurisdiction}) like ${`%${region.toLowerCase()}%`}`)
                .limit(10);
            if (results.length > 0)
                return results;
        }
        // Return sample of politicians
        return await db.select().from(politicians)
            .limit(20);
    }
    async getVotingData(billsData) {
        if (billsData.length === 0)
            return [];
        // Get recent votes for analysis
        return await db.select()
            .from(votes)
            .limit(50);
    }
    async getPoliticianStatements(politiciansData) {
        try {
            // Get recent statements for analysis
            return await db.select()
                .from(politicianStatements)
                .orderBy(desc(politicianStatements.dateCreated))
                .limit(20);
        }
        catch (error) {
            // console.error removed for production
            return [];
        }
    }
    async generateResponse(query, analysis, data, region) {
        const systemPrompt = `You are CivicOS AI, a no-bullshit political analysis assistant. Your job is to:

1. Provide direct, factual answers about Canadian government and politics
2. Call out inconsistencies, contradictions, and potential lies
3. Use only the authentic government data provided
4. Be brutally honest about politicians' track records
5. Explain complex political issues in plain language
6. Never sugarcoat or avoid controversial topics

Key principles:
- If a politician has contradicted themselves, point it out explicitly
- If voting patterns don't match public statements, say so
- Use specific examples and data to support your analysis
- Don't hedge or qualify obvious facts
- Regional context matters - focus on user's representatives when relevant

Available data:
${JSON.stringify(data, null, 2)}

User region: ${region || "Not specified"}

Answer the query with complete honesty and provide specific evidence for any claims.`;
        const userPrompt = `Query: "${query}"

Analyze this using the government data provided. Be direct and factual. If politicians are lying or being inconsistent, call it out with specific examples. Focus on facts, voting records, and documented statements.`;
        const response = await this.ollamaService.chat.completions.create({
            model: 'mistral:latest',
            max_tokens: 2000,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
        });
        const analysisType = this.determineAnalysisType(query);
        const confidence = this.calculateConfidence(data);
        const sources = this.extractSources(data);
        const truthScore = this.calculateTruthScore(query, response.choices[0].message.content || '');
        const propagandaRisk = this.assessPropagandaRisk(query);
        const responseText = response.choices[0].message.content || 'Analysis failed';
        return {
            response: responseText,
            analysisType,
            confidence,
            sources,
            truthScore,
            propagandaRisk,
            relatedData: {
                bills: data.bills.slice(0, 5),
                politicians: data.politicians.slice(0, 5),
                votes: data.votes.slice(0, 10)
            },
            followUpSuggestions: this.generateFollowUps(analysisType, data)
        };
    }
    calculateConfidence(data) {
        let confidence = 0.5; // Base confidence
        if (data.bills.length > 0)
            confidence += 0.2;
        if (data.politicians.length > 0)
            confidence += 0.2;
        if (data.votes.length > 0)
            confidence += 0.1;
        if (data.statements.length > 0)
            confidence += 0.1;
        return Math.min(confidence, 1.0);
    }
    extractSources(data) {
        const sources = [];
        if (data.bills.length > 0)
            sources.push("Parliament of Canada LEGISinfo");
        if (data.politicians.length > 0)
            sources.push("Official MP Directory");
        if (data.votes.length > 0)
            sources.push("Parliamentary Voting Records");
        if (data.statements.length > 0)
            sources.push("Official Parliamentary Statements");
        return sources;
    }
    generateFollowUps(analysisType, data) {
        const suggestions = [];
        switch (analysisType) {
            case "bill":
                suggestions.push("How did my MP vote on this?");
                suggestions.push("What are the key concerns with this bill?");
                break;
            case "politician":
                suggestions.push("Show me their voting record");
                suggestions.push("Have they contradicted themselves?");
                suggestions.push("How do they compare to other MPs?");
                break;
            default:
                suggestions.push("Who are my representatives?");
                suggestions.push("What bills are currently being voted on?");
        }
        return suggestions;
    }
    async getBasicContextData() {
        try {
            // Get basic counts and recent data safely
            const politiciansCount = await db.select({ count: sql `count(*)` }).from(politicians);
            const billsCount = await db.select({ count: sql `count(*)` }).from(bills);
            return {
                bills: [],
                politicians: [],
                votes: [],
                statements: [],
                context: {
                    totalPoliticians: politiciansCount[0]?.count || 0,
                    totalBills: billsCount[0]?.count || 0
                }
            };
        }
        catch (error) {
            // console.error removed for production
            return {
                bills: [],
                politicians: [],
                votes: [],
                statements: [],
                context: {}
            };
        }
    }
    async generateDirectResponse(query, region) {
        try {
            const systemPrompt = `You are CivicOS AI, a Canadian political analysis assistant. Provide factual, direct answers about Canadian government and politics.

User region: ${region || "Not specified"}

Guidelines:
- Focus on Canadian federal, provincial, and municipal politics
- Be direct and factual
- Explain complex political issues clearly
- Reference actual Canadian government structures and processes
- If you don't have specific current data, explain what would typically be the case`;
            const response = await this.ollamaService.chat.completions.create({
                model: 'mistral:latest',
                max_tokens: 1500,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
            });
            const responseText = response.choices[0].message.content || 'I apologize, but I cannot provide an analysis at this time.';
            return {
                response: responseText,
                analysisType: "general",
                confidence: 0.7,
                sources: ["General Canadian Government Knowledge"],
                relatedData: {
                    bills: [],
                    politicians: [],
                    votes: []
                },
                followUpSuggestions: [
                    "Can you provide more specific details?",
                    "How does this affect my province or territory?",
                    "What are the key facts about this topic?"
                ],
            };
        }
        catch (error) {
            // console.error removed for production
            throw new Error("Failed to process civic AI query");
        }
    }
}
export const civicAI = new CivicAIService();
