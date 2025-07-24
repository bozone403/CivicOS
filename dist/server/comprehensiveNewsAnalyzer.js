import { db } from "./db.js";
import { newsArticles, newsComparisons } from "../shared/schema.js";
// import { eq, desc, and, gte, sql } from "drizzle-orm";
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import aiService from './utils/aiService.js';
// interface TopicComparison {
//   topic: string;
//   articles: ArticleAnalysis[];
//   consensusLevel: number;
//   majorDiscrepancies: string[];
//   propagandaPatterns: string[];
//   factualAccuracy: number;
//   politicalBias: {
//     left: number;
//     center: number;
//     right: number;
//   };
// }
/**
 * Comprehensive news analyzer for Canadian political content
 */
export class ComprehensiveNewsAnalyzer {
    canadianNewsSources = [
        // Major Mainstream Media
        {
            name: "CBC News",
            url: "https://www.cbc.ca",
            rssUrl: "https://www.cbc.ca/cmlink/rss-topstories",
            bias: "center",
            credibilityScore: 85,
            type: "government"
        },
        {
            name: "Global News",
            url: "https://globalnews.ca",
            rssUrl: "https://globalnews.ca/feed/",
            bias: "center",
            credibilityScore: 82,
            type: "mainstream"
        },
        {
            name: "CTV News",
            url: "https://www.ctvnews.ca",
            rssUrl: "https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009",
            bias: "center",
            credibilityScore: 83,
            type: "mainstream"
        },
        {
            name: "The Globe and Mail",
            url: "https://www.theglobeandmail.com",
            rssUrl: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/politics/",
            bias: "center",
            credibilityScore: 88,
            type: "mainstream"
        },
        {
            name: "National Post",
            url: "https://nationalpost.com",
            rssUrl: "https://nationalpost.com/feed/",
            bias: "right",
            credibilityScore: 78,
            type: "mainstream"
        },
        {
            name: "Toronto Star",
            url: "https://www.thestar.com",
            rssUrl: "https://www.thestar.com/politics.rss",
            bias: "left",
            credibilityScore: 79,
            type: "mainstream"
        },
        // French-Canadian Media
        {
            name: "Le Devoir",
            url: "https://www.ledevoir.com",
            rssUrl: "https://www.ledevoir.com/rss/section/politique.xml",
            bias: "center",
            credibilityScore: 84,
            type: "mainstream"
        },
        {
            name: "La Presse",
            url: "https://www.lapresse.ca",
            rssUrl: "https://www.lapresse.ca/actualites/politique.rss",
            bias: "center",
            credibilityScore: 82,
            type: "mainstream"
        },
        {
            name: "Radio-Canada",
            url: "https://ici.radio-canada.ca",
            rssUrl: "https://ici.radio-canada.ca/rss/73",
            bias: "center",
            credibilityScore: 87,
            type: "government"
        },
        {
            name: "Journal de Montréal",
            url: "https://www.journaldemontreal.com",
            rssUrl: "https://www.journaldemontreal.com/rss.xml",
            bias: "center",
            credibilityScore: 71,
            type: "mainstream"
        },
        // Government/Official Sources
        {
            name: "The Canadian Press",
            url: "https://www.thecanadianpress.com",
            rssUrl: "https://www.thecanadianpress.com/feed/",
            bias: "center",
            credibilityScore: 90,
            type: "government"
        },
        {
            name: "Government of Canada News",
            url: "https://www.canada.ca",
            rssUrl: "https://www.canada.ca/en/news.rss",
            bias: "center",
            credibilityScore: 95,
            type: "government"
        },
        // Political Specialist Media
        {
            name: "iPolitics",
            url: "https://ipolitics.ca",
            rssUrl: "https://ipolitics.ca/feed/",
            bias: "center",
            credibilityScore: 81,
            type: "alternative"
        },
        {
            name: "The Hill Times",
            url: "https://www.hilltimes.com",
            rssUrl: "https://www.hilltimes.com/feed/",
            bias: "center",
            credibilityScore: 86,
            type: "alternative"
        },
        {
            name: "Policy Options",
            url: "https://policyoptions.irpp.org",
            rssUrl: "https://policyoptions.irpp.org/feed/",
            bias: "center",
            credibilityScore: 89,
            type: "alternative"
        },
        // Regional Major Papers
        {
            name: "Calgary Herald",
            url: "https://calgaryherald.com",
            rssUrl: "https://calgaryherald.com/feed/",
            bias: "center",
            credibilityScore: 76,
            type: "mainstream"
        },
        {
            name: "Edmonton Journal",
            url: "https://edmontonjournal.com",
            rssUrl: "https://edmontonjournal.com/feed/",
            bias: "center",
            credibilityScore: 77,
            type: "mainstream"
        },
        {
            name: "Vancouver Sun",
            url: "https://vancouversun.com",
            rssUrl: "https://vancouversun.com/feed/",
            bias: "center",
            credibilityScore: 78,
            type: "mainstream"
        },
        {
            name: "The Province",
            url: "https://theprovince.com",
            rssUrl: "https://theprovince.com/feed/",
            bias: "center",
            credibilityScore: 74,
            type: "mainstream"
        },
        {
            name: "Times Colonist",
            url: "https://www.timescolonist.com",
            rssUrl: "https://www.timescolonist.com/feed/",
            bias: "center",
            credibilityScore: 75,
            type: "mainstream"
        },
        {
            name: "Winnipeg Free Press",
            url: "https://www.winnipegfreepress.com",
            rssUrl: "https://www.winnipegfreepress.com/rss/",
            bias: "center",
            credibilityScore: 79,
            type: "mainstream"
        },
        {
            name: "The Chronicle Herald",
            url: "https://www.thechronicleherald.ca",
            rssUrl: "https://www.thechronicleherald.ca/rss/",
            bias: "center",
            credibilityScore: 73,
            type: "mainstream"
        },
        // Independent & Alternative Media
        {
            name: "The Tyee",
            url: "https://thetyee.ca",
            rssUrl: "https://thetyee.ca/rss2.xml",
            bias: "left",
            credibilityScore: 82,
            type: "alternative"
        },
        {
            name: "Canadaland",
            url: "https://www.canadaland.com",
            rssUrl: "https://www.canadaland.com/feed/",
            bias: "left",
            credibilityScore: 78,
            type: "alternative"
        },
        {
            name: "The Breach",
            url: "https://breachmedia.ca",
            rssUrl: "https://breachmedia.ca/feed/",
            bias: "left",
            credibilityScore: 76,
            type: "alternative"
        },
        {
            name: "True North",
            url: "https://tnc.news",
            rssUrl: "https://tnc.news/feed/",
            bias: "right",
            credibilityScore: 65,
            type: "alternative"
        },
        {
            name: "Rebel News",
            url: "https://www.rebelnews.com",
            rssUrl: "https://www.rebelnews.com/rss.xml",
            bias: "right",
            credibilityScore: 45,
            type: "alternative"
        },
        {
            name: "Press Progress",
            url: "https://pressprogress.ca",
            rssUrl: "https://pressprogress.ca/feed/",
            bias: "left",
            credibilityScore: 72,
            type: "alternative"
        },
        {
            name: "National Observer",
            url: "https://www.nationalobserver.com",
            rssUrl: "https://www.nationalobserver.com/rss.xml",
            bias: "left",
            credibilityScore: 81,
            type: "alternative"
        },
        {
            name: "The Narwhal",
            url: "https://thenarwhal.ca",
            rssUrl: "https://thenarwhal.ca/feed/",
            bias: "left",
            credibilityScore: 85,
            type: "alternative"
        },
        // Business & Financial
        {
            name: "Financial Post",
            url: "https://financialpost.com",
            rssUrl: "https://financialpost.com/feed/",
            bias: "center",
            credibilityScore: 83,
            type: "mainstream"
        },
        {
            name: "BNN Bloomberg",
            url: "https://www.bnnbloomberg.ca",
            rssUrl: "https://www.bnnbloomberg.ca/rss.xml",
            bias: "center",
            credibilityScore: 86,
            type: "mainstream"
        },
        // Indigenous Media
        {
            name: "APTN News",
            url: "https://www.aptnnews.ca",
            rssUrl: "https://www.aptnnews.ca/feed/",
            bias: "center",
            credibilityScore: 88,
            type: "alternative"
        },
        {
            name: "Windspeaker",
            url: "https://windspeaker.com",
            rssUrl: "https://windspeaker.com/feed/",
            bias: "center",
            credibilityScore: 84,
            type: "alternative"
        },
        // Online-Native
        {
            name: "HuffPost Canada",
            url: "https://www.huffpost.com/canada",
            rssUrl: "https://www.huffpost.com/section/canada/feed",
            bias: "left",
            credibilityScore: 74,
            type: "alternative"
        },
        {
            name: "Blacklock's Reporter",
            url: "https://www.blacklocks.ca",
            rssUrl: "https://www.blacklocks.ca/feed/",
            bias: "center",
            credibilityScore: 89,
            type: "alternative"
        },
        {
            name: "The Conversation Canada",
            url: "https://theconversation.com/ca",
            rssUrl: "https://theconversation.com/ca/articles.atom",
            bias: "center",
            credibilityScore: 91,
            type: "alternative"
        },
        // Additional Regional Papers
        {
            name: "Ottawa Citizen",
            url: "https://ottawacitizen.com",
            rssUrl: "https://ottawacitizen.com/feed/",
            bias: "center",
            credibilityScore: 76,
            type: "mainstream"
        },
        {
            name: "Montreal Gazette",
            url: "https://montrealgazette.com",
            rssUrl: "https://montrealgazette.com/feed/",
            bias: "center",
            credibilityScore: 77,
            type: "mainstream"
        },
        {
            name: "Regina Leader-Post",
            url: "https://leaderpost.com",
            rssUrl: "https://leaderpost.com/feed/",
            bias: "center",
            credibilityScore: 73,
            type: "mainstream"
        },
        {
            name: "Saskatoon StarPhoenix",
            url: "https://thestarphoenix.com",
            rssUrl: "https://thestarphoenix.com/feed/",
            bias: "center",
            credibilityScore: 74,
            type: "mainstream"
        },
        // Local/Community Papers
        {
            name: "North Shore News",
            url: "https://www.nsnews.com",
            rssUrl: "https://www.nsnews.com/rss.xml",
            bias: "center",
            credibilityScore: 72,
            type: "mainstream"
        },
        {
            name: "The Record (Kitchener-Waterloo)",
            url: "https://www.therecord.com",
            rssUrl: "https://www.therecord.com/feed/",
            bias: "center",
            credibilityScore: 71,
            type: "mainstream"
        },
        {
            name: "London Free Press",
            url: "https://lfpress.com",
            rssUrl: "https://lfpress.com/feed/",
            bias: "center",
            credibilityScore: 73,
            type: "mainstream"
        },
        {
            name: "Windsor Star",
            url: "https://windsorstar.com",
            rssUrl: "https://windsorstar.com/feed/",
            bias: "center",
            credibilityScore: 74,
            type: "mainstream"
        },
        // Additional French Media
        {
            name: "Le Journal de Québec",
            url: "https://www.journaldequebec.com",
            rssUrl: "https://www.journaldequebec.com/rss.xml",
            bias: "center",
            credibilityScore: 70,
            type: "mainstream"
        },
        {
            name: "TVA Nouvelles",
            url: "https://www.tvanouvelles.ca",
            rssUrl: "https://www.tvanouvelles.ca/rss.xml",
            bias: "center",
            credibilityScore: 75,
            type: "mainstream"
        },
        {
            name: "Le Soleil",
            url: "https://www.lesoleil.com",
            rssUrl: "https://www.lesoleil.com/rss.xml",
            bias: "center",
            credibilityScore: 78,
            type: "mainstream"
        },
        // Atlantic Canada
        {
            name: "Telegraph-Journal",
            url: "https://www.telegraphjournal.com",
            rssUrl: "https://www.telegraphjournal.com/rss/",
            bias: "center",
            credibilityScore: 75,
            type: "mainstream"
        },
        {
            name: "The Guardian (PEI)",
            url: "https://www.theguardian.pe.ca",
            rssUrl: "https://www.theguardian.pe.ca/rss/",
            bias: "center",
            credibilityScore: 73,
            type: "mainstream"
        },
        {
            name: "The Telegram",
            url: "https://www.thetelegram.com",
            rssUrl: "https://www.thetelegram.com/rss/",
            bias: "center",
            credibilityScore: 74,
            type: "mainstream"
        },
        // Northern/Territorial
        {
            name: "Whitehorse Star",
            url: "https://www.whitehorsestar.com",
            rssUrl: "https://www.whitehorsestar.com/rss/",
            bias: "center",
            credibilityScore: 72,
            type: "mainstream"
        },
        {
            name: "Yellowknifer",
            url: "https://www.nnsl.com/yellowknifer",
            rssUrl: "https://www.nnsl.com/yellowknifer/rss/",
            bias: "center",
            credibilityScore: 71,
            type: "mainstream"
        },
        {
            name: "Nunavut News",
            url: "https://www.nunavutnews.com",
            rssUrl: "https://www.nunavutnews.com/rss/",
            bias: "center",
            credibilityScore: 70,
            type: "mainstream"
        },
        // Additional Independent/Alternative
        {
            name: "Ricochet",
            url: "https://ricochet.media",
            rssUrl: "https://ricochet.media/en/feed",
            bias: "left",
            credibilityScore: 79,
            type: "alternative"
        },
        {
            name: "The Energy Mix",
            url: "https://www.theenergymix.com",
            rssUrl: "https://www.theenergymix.com/feed/",
            bias: "left",
            credibilityScore: 83,
            type: "alternative"
        },
        {
            name: "Epoch Times Canada",
            url: "https://www.theepochtimes.com/canada",
            rssUrl: "https://www.theepochtimes.com/canada/feed",
            bias: "right",
            credibilityScore: 68,
            type: "alternative"
        },
        {
            name: "Western Standard",
            url: "https://www.westernstandard.news",
            rssUrl: "https://www.westernstandard.news/feed/",
            bias: "right",
            credibilityScore: 62,
            type: "alternative"
        },
        {
            name: "The Post Millennial",
            url: "https://thepostmillennial.com",
            rssUrl: "https://thepostmillennial.com/feed",
            bias: "right",
            credibilityScore: 58,
            type: "alternative"
        },
        // Specialized/Professional
        {
            name: "Law Times",
            url: "https://www.lawtimesnews.com",
            rssUrl: "https://www.lawtimesnews.com/rss/",
            bias: "center",
            credibilityScore: 85,
            type: "alternative"
        },
        {
            name: "Canadian Lawyer",
            url: "https://www.canadianlawyermag.com",
            rssUrl: "https://www.canadianlawyermag.com/rss/",
            bias: "center",
            credibilityScore: 87,
            type: "alternative"
        },
        {
            name: "Parliamentary Hill Times",
            url: "https://www.hilltimes.com",
            rssUrl: "https://www.hilltimes.com/feed/",
            bias: "center",
            credibilityScore: 86,
            type: "alternative"
        }
    ];
    /**
     * Perform comprehensive news analysis across all Canadian sources
     */
    async performComprehensiveAnalysis() {
        const articles = [];
        // Scrape articles from all sources
        for (const source of this.canadianNewsSources) {
            try {
                const sourceArticles = await this.scrapeNewsSource(source);
                articles.push(...sourceArticles);
                // Delay between sources to be respectful
                await this.delay(2000);
            }
            catch (error) {
                // console.error removed for production
            }
        }
        // Group articles by topic for comparison
        const topicGroups = await this.groupArticlesByTopic(articles);
        // Perform cross-source comparison and analysis
        for (const topic of Object.keys(topicGroups)) {
            if (topicGroups[topic].length >= 2) { // Only analyze topics covered by multiple sources
                await this.performTopicComparison(topic, topicGroups[topic]);
            }
        }
        // Store individual articles
        for (const article of articles) {
            await this.storeArticle(article);
        }
    }
    /**
     * Scrape and analyze articles from a specific news source
     */
    async scrapeNewsSource(source) {
        const articles = [];
        try {
            const response = await fetch(source.rssUrl, {
                headers: {
                    'User-Agent': 'CivicOS News Analyzer 1.0 (Democratic Platform)',
                }
            });
            if (!response.ok) {
                return [];
            }
            const rssText = await response.text();
            const $ = cheerio.load(rssText, { xmlMode: true });
            // Parse RSS items
            $('item').each((index, element) => {
                if (index < 10) { // Limit to 10 recent articles per source
                    const $item = $(element);
                    const title = $item.find('title').text().trim();
                    const url = $item.find('link').text().trim() || $item.find('guid').text().trim();
                    const description = $item.find('description').text().trim();
                    const pubDate = $item.find('pubDate').text().trim();
                    if (title && url && this.isPoliticalContent(title, description)) {
                        articles.push({
                            id: `${source.name}-${Date.now()}-${index}`,
                            title,
                            url,
                            source: source.name,
                            content: description,
                            publishedAt: pubDate ? new Date(pubDate) : new Date(),
                            bias: source.bias,
                            credibilityScore: source.credibilityScore,
                            propagandaTechniques: [],
                            keyTopics: [],
                            politiciansInvolved: [],
                            factualityScore: 0,
                            emotionalTone: 'neutral',
                            claims: []
                        });
                    }
                }
            });
            // Analyze each article with AI
            for (const article of articles) {
                const analyzedArticle = await this.analyzeArticleContent(article);
                // Update the article in the array with analyzed content
                Object.assign(article, analyzedArticle);
                await this.delay(1000); // Rate limiting
            }
        }
        catch (error) {
            // console.error removed for production
            return [];
        }
        return articles;
    }
    /**
     * Check if content is political/civic related
     */
    isPoliticalContent(title, description) {
        const politicalKeywords = [
            'trudeau', 'poilievre', 'singh', 'blanchet', 'parliament', 'mp', 'minister',
            'federal', 'provincial', 'government', 'policy', 'legislation', 'bill',
            'election', 'vote', 'liberal', 'conservative', 'ndp', 'bloc', 'green',
            'senate', 'house of commons', 'cabinet', 'political', 'politics',
            'healthcare', 'climate', 'economy', 'immigration', 'defence', 'budget',
            'covid', 'pandemic', 'vaccine', 'freedom convoy', 'protest'
        ];
        const content = (title + ' ' + description).toLowerCase();
        return politicalKeywords.some(keyword => content.includes(keyword));
    }
    /**
     * Analyze article content using AI for propaganda detection and bias analysis
     */
    async analyzeArticleContent(article) {
        try {
            // Fetch full article content if possible
            let fullContent = article.content;
            try {
                const articleResponse = await fetch(article.url, {
                    headers: {
                        'User-Agent': 'CivicOS News Analyzer 1.0',
                    }
                });
                if (articleResponse.ok) {
                    const articleHtml = await articleResponse.text();
                    const $article = cheerio.load(articleHtml);
                    // Extract main content (common selectors)
                    const contentSelectors = [
                        'article p', '.article-content p', '.entry-content p',
                        '.post-content p', '.story-content p', '.article-body p',
                        'main p', '.content p'
                    ];
                    for (const selector of contentSelectors) {
                        const paragraphs = $article(selector);
                        if (paragraphs.length > 2) {
                            fullContent = paragraphs.map((_, el) => $article(el).text()).get().join('\n');
                            break;
                        }
                    }
                }
            }
            catch (fetchError) {
                // Use RSS description if full article fetch fails
            }
            const analysisPrompt = `
Analyze this Canadian news article for political bias, propaganda techniques, and factual accuracy:

Title: ${article.title}
Source: ${article.source}
Content: ${fullContent.substring(0, 2000)}

Provide analysis in JSON format:
{
  "propagandaTechniques": ["technique1", "technique2"],
  "keyTopics": ["topic1", "topic2"],
  "politiciansInvolved": ["politician1", "politician2"],
  "factualityScore": 0-100,
  "emotionalTone": "neutral|positive|negative|angry|fearful|hopeful",
  "biasAnalysis": "left|center|right",
  "claims": [
    {
      "claim": "specific factual claim",
      "evidence": "evidence provided",
      "verifiable": true/false,
      "contradictions": ["potential contradictions"]
    }
  ],
  "propagandaAnalysis": "detailed analysis of propaganda techniques used",
  "credibilityAssessment": "assessment of source credibility and article quality"
}

Focus on Canadian political context and identify:
- Emotional manipulation techniques
- Cherry-picked statistics or quotes
- False dichotomies
- Ad hominem attacks
- Loaded language
- Confirmation bias
- Strawman arguments
- Appeal to fear/emotion
`;
            const responseText = await aiService.generateResponse(analysisPrompt);
            const analysis = this.parseAnalysisResponse(responseText);
            return {
                ...article,
                propagandaTechniques: analysis.propagandaTechniques || [],
                keyTopics: analysis.keyTopics || this.extractBasicTopics(article.title),
                politiciansInvolved: analysis.politiciansInvolved || this.extractPoliticians(article.title + ' ' + (article.content || '')),
                factualityScore: analysis.factualityScore || 70,
                emotionalTone: analysis.emotionalTone || 'neutral',
                claims: analysis.claims || []
            };
        }
        catch (error) {
            // console.error removed for production
        }
        return article;
    }
    /**
     * Extract basic topics from text
     */
    extractBasicTopics(text) {
        const topics = [];
        const politicalKeywords = {
            'healthcare': 'Healthcare',
            'economy': 'Economy',
            'education': 'Education',
            'environment': 'Environment',
            'defense': 'Defense',
            'immigration': 'Immigration',
            'tax': 'Taxation',
            'budget': 'Budget',
            'election': 'Elections',
            'parliament': 'Parliament'
        };
        const lowerText = text.toLowerCase();
        for (const [keyword, topic] of Object.entries(politicalKeywords)) {
            if (lowerText.includes(keyword)) {
                topics.push(topic);
            }
        }
        return topics.length > 0 ? topics : ['General'];
    }
    /**
     * Extract politician names from text
     */
    extractPoliticians(text) {
        const politicians = [];
        const commonPoliticians = [
            'Trudeau', 'Singh', 'Poilievre', 'Blanchet', 'May',
            'Ford', 'Legault', 'Moe', 'Kenney', 'Horgan'
        ];
        for (const politician of commonPoliticians) {
            if (text.includes(politician)) {
                politicians.push(politician);
            }
        }
        return politicians;
    }
    /**
     * Parse AI analysis response
     */
    parseAnalysisResponse(responseText) {
        try {
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        catch (error) {
            // console.error removed for production
        }
        return {
            propagandaTechniques: [],
            keyTopics: [],
            politiciansInvolved: [],
            factualityScore: 50,
            emotionalTone: 'neutral',
            claims: []
        };
    }
    /**
     * Group articles by topic for cross-source comparison
     */
    async groupArticlesByTopic(articles) {
        const topicGroups = {};
        for (const article of articles) {
            for (const topic of article.keyTopics) {
                if (!topicGroups[topic]) {
                    topicGroups[topic] = [];
                }
                topicGroups[topic].push(article);
            }
        }
        return topicGroups;
    }
    /**
     * Perform cross-source comparison for a specific topic
     */
    async performTopicComparison(topic, articles) {
        try {
            const comparisonPrompt = `
Compare these ${articles.length} Canadian news articles covering "${topic}":

${articles.map((article, index) => `
Article ${index + 1} (${article.source}):
Title: ${article.title}
Bias: ${article.bias}
Content: ${article.content.substring(0, 500)}
`).join('\n')}

Provide comparison analysis in JSON format:
{
  "consensusLevel": 0-100,
  "majorDiscrepancies": ["discrepancy1", "discrepancy2"],
  "propagandaPatterns": ["pattern1", "pattern2"],
  "factualAccuracy": 0-100,
  "politicalBias": {
    "left": 0-100,
    "center": 0-100,
    "right": 0-100
  },
  "mediaManipulation": "analysis of potential media manipulation",
  "publicImpact": "assessment of impact on public opinion",
  "recommendedAction": "recommended action for citizens"
}

Focus on:
- Contradictory facts or claims between sources
- Different framing of the same events
- Omitted information in some sources
- Coordinated messaging patterns
- Emotional manipulation differences
`;
            const responseText = await aiService.generateResponse(comparisonPrompt);
            const comparison = this.parseAnalysisResponse(responseText);
            // Store comparison results
            await this.storeTopicComparison(topic, articles, comparison);
        }
        catch (error) {
            return; // Skip when API unavailable
        }
    }
    /**
     * Store article in database
     */
    async storeArticle(article) {
        try {
            await db.insert(newsArticles).values({
                title: article.title,
                url: article.url,
                source: article.source,
                content: article.content,
                publishedAt: article.publishedAt,
                bias: article.bias,
                credibilityScore: article.credibilityScore.toString(),
                propagandaTechniques: article.propagandaTechniques,
                keyTopics: article.keyTopics,
                politiciansInvolved: article.politiciansInvolved,
                factualityScore: article.factualityScore,
                emotionalTone: article.emotionalTone,
                claims: article.claims,
                analysisDate: new Date(),
                isVerified: true,
                publicImpact: this.calculatePublicImpact(article),
                biasScore: this.calculateBiasScore(article.bias).toString(),
                sentimentScore: this.calculateSentimentScore(article.emotionalTone)
            }).onConflictDoUpdate({
                target: newsArticles.url,
                set: {
                    credibilityScore: article.credibilityScore.toString(),
                    propagandaTechniques: article.propagandaTechniques,
                    factualityScore: article.factualityScore,
                    analysisDate: new Date()
                }
            });
        }
        catch (error) {
            // console.error removed for production
        }
    }
    /**
     * Store topic comparison results
     */
    async storeTopicComparison(topic, articles, comparison) {
        try {
            await db.insert(newsComparisons).values({
                topic: topic,
                sources: articles.map(a => a.source),
                consensusLevel: comparison.consensusLevel || 50,
                majorDiscrepancies: comparison.majorDiscrepancies || [],
                propagandaPatterns: comparison.propagandaPatterns || [],
                factualAccuracy: comparison.factualAccuracy || 50,
                politicalBias: comparison.politicalBias || { left: 33, center: 34, right: 33 },
                mediaManipulation: comparison.mediaManipulation || '',
                publicImpact: comparison.publicImpact || '',
                recommendedAction: comparison.recommendedAction || '',
                analysisDate: new Date(),
                articleCount: articles.length
            }).onConflictDoUpdate({
                target: newsComparisons.topic,
                set: {
                    consensusLevel: comparison.consensusLevel || 50,
                    factualAccuracy: comparison.factualAccuracy || 50,
                    analysisDate: new Date()
                }
            });
        }
        catch (error) {
            // console.error removed for production
        }
    }
    /**
     * Calculate public impact score
     */
    calculatePublicImpact(article) {
        let impact = 50; // Base score
        // Increase for political figures
        if (article.politiciansInvolved.length > 0)
            impact += 20;
        // Increase for propaganda techniques
        impact += article.propagandaTechniques.length * 5;
        // Adjust for emotional tone
        if (['angry', 'fearful'].includes(article.emotionalTone))
            impact += 15;
        // Adjust for credibility
        if (article.credibilityScore < 70)
            impact += 10;
        return Math.min(100, Math.max(0, impact));
    }
    /**
     * Calculate bias score
     */
    calculateBiasScore(bias) {
        switch (bias) {
            case 'left': return -50;
            case 'right': return 50;
            case 'center': return 0;
            default: return 0;
        }
    }
    /**
     * Calculate sentiment score
     */
    calculateSentimentScore(tone) {
        switch (tone) {
            case 'positive':
            case 'hopeful': return 75;
            case 'negative':
            case 'angry':
            case 'fearful': return -75;
            case 'neutral': return 0;
            default: return 0;
        }
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
export const comprehensiveNewsAnalyzer = new ComprehensiveNewsAnalyzer();
