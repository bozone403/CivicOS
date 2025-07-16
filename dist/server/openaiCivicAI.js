import OpenAI from "openai";
import { db } from "./db";
import { sql } from "drizzle-orm";
export class OpenAICivicAIService {
    openai;
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async processQuery(request) {
        try {
            // Analyze the query to understand intent
            const analysis = await this.analyzeQuery(request.query);
            // Gather relevant Canadian government data
            const data = await this.gatherRelevantData(analysis, request.region);
            // Generate comprehensive response
            const response = await this.generateResponse(request.query, analysis, data, request.region, request.conversationHistory);
            return response;
        }
        catch (error) {
            console.error("Error processing civic AI query:", error);
            return {
                response: "I'm unable to process your request at the moment. Please try rephrasing your question about Canadian politics, bills, or politicians.",
                analysisType: "general",
                confidence: 0,
                sources: [],
                followUpSuggestions: [
                    "Ask about specific Canadian politicians",
                    "Inquire about recent federal bills",
                    "Check voting records for your district"
                ]
            };
        }
    }
    async analyzeQuery(query) {
        try {
            const prompt = `Analyze this Canadian civic/political query and categorize it:

Query: "${query}"

Provide analysis in JSON format:
{
  "type": "bill|politician|voting|general",
  "keywords": ["keyword1", "keyword2"],
  "jurisdiction": "federal|provincial|municipal|unknown",
  "intent": "information|analysis|comparison|action",
  "entities": ["entity1", "entity2"],
  "timeframe": "current|historical|future|unspecified"
}`;
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert Canadian political analyst. Analyze civic queries to understand user intent and extract relevant political entities."
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                max_tokens: 300
            });
            return JSON.parse(response.choices[0].message.content || "{}");
        }
        catch (error) {
            console.error("Error analyzing query:", error);
            return {
                type: "general",
                keywords: [],
                jurisdiction: "unknown",
                intent: "information",
                entities: [],
                timeframe: "unspecified"
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
            if (analysis.type === 'bill' || analysis.keywords.some((k) => ['bill', 'legislation', 'law', 'act'].includes(k.toLowerCase()))) {
                data.bills = await this.searchBills(analysis);
            }
            // Search for relevant politicians
            if (analysis.type === 'politician' || analysis.entities.length > 0) {
                data.politicians = await this.searchPoliticians(analysis, region);
            }
            // Get voting data if relevant
            if (analysis.type === 'voting' || analysis.keywords.some((k) => ['vote', 'voting', 'election'].includes(k.toLowerCase()))) {
                data.votes = await this.getVotingData(data.bills);
            }
            // Get politician statements
            if (data.politicians.length > 0) {
                data.statements = await this.getPoliticianStatements(data.politicians);
            }
        }
        catch (error) {
            console.error("Error gathering relevant data:", error);
        }
        return data;
    }
    async searchBills(analysis) {
        try {
            const keywords = analysis.keywords.join(' ');
            const bills = await db.execute(sql `
        SELECT 
          id, title, summary, status, date_introduced, 
          sponsor, category, reading_stage
        FROM bills 
        WHERE 
          title ILIKE ${`%${keywords}%`} OR 
          summary ILIKE ${`%${keywords}%`} OR
          category ILIKE ${`%${keywords}%`}
        ORDER BY date_introduced DESC
        LIMIT 10
      `);
            return bills.rows;
        }
        catch (error) {
            console.error("Error searching bills:", error);
            return [];
        }
    }
    async searchPoliticians(analysis, region) {
        try {
            const keywords = analysis.entities.concat(analysis.keywords).join(' ');
            let query = sql `
        SELECT 
          id, name, position, party, province, 
          riding, email, phone, office_address
        FROM politicians 
        WHERE 
          name ILIKE ${`%${keywords}%`} OR 
          party ILIKE ${`%${keywords}%`} OR
          position ILIKE ${`%${keywords}%`}
      `;
            if (region) {
                query = sql `
          SELECT 
            id, name, position, party, province, 
            riding, email, phone, office_address
          FROM politicians 
          WHERE 
            (name ILIKE ${`%${keywords}%`} OR 
             party ILIKE ${`%${keywords}%`} OR
             position ILIKE ${`%${keywords}%`}) AND
            (province ILIKE ${`%${region}%`} OR 
             riding ILIKE ${`%${region}%`})
        `;
            }
            query = sql `${query} ORDER BY name LIMIT 10`;
            const politicians = await db.execute(query);
            return politicians.rows;
        }
        catch (error) {
            console.error("Error searching politicians:", error);
            return [];
        }
    }
    async getVotingData(billsData) {
        try {
            if (billsData.length === 0)
                return [];
            const billIds = billsData.map(bill => bill.id);
            const votes = await db.execute(sql `
        SELECT 
          bv.bill_id, bv.user_id, bv.vote_value, 
          bv.timestamp, b.title as bill_title
        FROM bill_votes bv
        JOIN bills b ON bv.bill_id = b.id
        WHERE bv.bill_id = ANY(${billIds})
        ORDER BY bv.timestamp DESC
        LIMIT 50
      `);
            return votes.rows;
        }
        catch (error) {
            console.error("Error getting voting data:", error);
            return [];
        }
    }
    async getPoliticianStatements(politiciansData) {
        try {
            if (politiciansData.length === 0)
                return [];
            const politicianNames = politiciansData.map(p => p.name);
            const statements = await db.execute(sql `
        SELECT 
          politician_name, statement_text, date_made, 
          context, source_url
        FROM politician_statements 
        WHERE politician_name = ANY(${politicianNames})
        ORDER BY date_made DESC
        LIMIT 20
      `);
            return statements.rows;
        }
        catch (error) {
            console.error("Error getting politician statements:", error);
            return [];
        }
    }
    async generateResponse(query, analysis, data, region, history) {
        try {
            let contextData = "";
            if (data.bills.length > 0) {
                contextData += `\nRelevant Bills:\n${data.bills.map((bill) => `- ${bill.title} (${bill.status}): ${bill.summary || 'No summary available'}`).join('\n')}`;
            }
            if (data.politicians.length > 0) {
                contextData += `\nRelevant Politicians:\n${data.politicians.map((pol) => `- ${pol.name} (${pol.party}, ${pol.position}): ${pol.province || 'Unknown province'}`).join('\n')}`;
            }
            if (data.votes.length > 0) {
                contextData += `\nRecent Voting Activity:\n${data.votes.slice(0, 5).map((vote) => `- ${vote.bill_title}: ${vote.vote_value} vote`).join('\n')}`;
            }
            const conversationContext = history ?
                history.map(msg => `${msg.role}: ${msg.content}`).join('\n') : '';
            const prompt = `You are a Canadian civic AI assistant. Answer this question about Canadian politics:

User Question: "${query}"
${region ? `User Region: ${region}` : ''}

Available Data:${contextData}

${conversationContext ? `Previous Conversation:\n${conversationContext}\n` : ''}

Provide a comprehensive, accurate response about Canadian politics. Focus on factual information from the provided data. If data is limited, acknowledge this clearly.

Include specific details about:
- Relevant politicians and their positions
- Current bills and legislation status
- Voting records where applicable
- Contact information for user's representatives

Keep the response conversational but authoritative.`;
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert Canadian political analyst and civic engagement specialist. Provide accurate, helpful information about Canadian politics, government, and civic processes."
                    },
                    { role: "user", content: prompt }
                ],
                max_tokens: 1000
            });
            const analysisType = this.determineAnalysisType(query, data);
            const confidence = this.calculateConfidence(data);
            const sources = this.extractSources(data);
            const followUps = this.generateFollowUps(analysisType, data);
            return {
                response: response.choices[0].message.content || "I couldn't generate a response. Please try again.",
                analysisType,
                confidence,
                sources,
                relatedData: data,
                followUpSuggestions: followUps
            };
        }
        catch (error) {
            console.error("Error generating response:", error);
            return {
                response: "I encountered an error processing your request. Please try rephrasing your question.",
                analysisType: "general",
                confidence: 0,
                sources: [],
                followUpSuggestions: ["Try asking about specific Canadian politicians or bills"]
            };
        }
    }
    determineAnalysisType(query, data) {
        if (data.bills.length > data.politicians.length)
            return "bill";
        if (data.politicians.length > 0)
            return "politician";
        return "general";
    }
    calculateConfidence(data) {
        let score = 50; // Base confidence
        if (data.bills.length > 0)
            score += 20;
        if (data.politicians.length > 0)
            score += 20;
        if (data.votes.length > 0)
            score += 10;
        if (data.statements.length > 0)
            score += 10;
        return Math.min(100, score);
    }
    extractSources(data) {
        const sources = [];
        if (data.bills.length > 0)
            sources.push("Parliament of Canada Bills Database");
        if (data.politicians.length > 0)
            sources.push("Official Government Directory");
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
                suggestions.push("Ask about voting records on this bill");
                suggestions.push("Find out who sponsored this legislation");
                suggestions.push("Check the current status of related bills");
                break;
            case "politician":
                suggestions.push("View their recent voting record");
                suggestions.push("See their policy positions");
                suggestions.push("Find their contact information");
                break;
            default:
                suggestions.push("Ask about your local representatives");
                suggestions.push("Search for recent Canadian legislation");
                suggestions.push("Check current political news");
        }
        return suggestions;
    }
}
export const openaiCivicAI = new OpenAICivicAIService();
