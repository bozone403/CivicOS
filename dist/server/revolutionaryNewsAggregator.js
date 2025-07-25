import { db } from "./db.js";
import { newsArticles } from "../shared/schema.js";
import { desc } from "drizzle-orm";
import * as cheerio from "cheerio";
import fetch from 'node-fetch';
import { aiService } from './utils/aiService.js';
/**
 * Revolutionary news aggregator using OpenAI for Canadian political intelligence
 */
export class RevolutionaryNewsAggregator {
    newsSources = [
        {
            name: "CBC News",
            url: "https://www.cbc.ca",
            rssUrl: "https://www.cbc.ca/cmlink/rss-canada",
            selectors: {
                title: [".headline", ".story-headline", "h1"],
                content: [".story-content", ".content", ".article-content"],
                author: [".author", ".byline", ".story-author"],
                publishDate: [".timestamp", ".story-date", "time"]
            }
        },
        {
            name: "Global News",
            url: "https://globalnews.ca",
            rssUrl: "https://globalnews.ca/feed/",
            selectors: {
                title: [".c-posts__headline", ".entry-title", "h1"],
                content: [".l-article__text", ".entry-content", ".article-content"],
                author: [".c-byline__author", ".author", ".byline"],
                publishDate: [".c-byline__date", ".entry-date", "time"]
            }
        },
        {
            name: "Toronto Star",
            url: "https://www.thestar.com",
            rssUrl: "https://www.thestar.com/news.rss",
            selectors: {
                title: [".headline", ".story-headline", "h1"],
                content: [".story-content", ".article-body", ".content"],
                author: [".author-name", ".byline", ".author"],
                publishDate: [".story-date", ".timestamp", "time"]
            }
        }
    ];
    /**
     * Perform comprehensive news aggregation with OpenAI analysis
     */
    async performComprehensiveAggregation() {
        for (const source of this.newsSources) {
            try {
                await this.processNewsSource(source);
                await this.delay(2000); // Respectful delay
            }
            catch (error) {
                // console.error removed for production
            }
        }
    }
    /**
     * Process individual news source with OpenAI intelligence
     */
    async processNewsSource(source) {
        try {
            const response = await fetch(source.rssUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; CivicOS/1.0; +https://civicos.ca)'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const rssContent = await response.text();
            const articles = await this.parseRSSFeed(rssContent, source);
            for (const article of articles.slice(0, 5)) { // Process top 5 articles
                try {
                    const analyzedArticle = await this.analyzeArticleWithOpenAI(article, source);
                    await this.storeAnalyzedArticle(analyzedArticle);
                    await this.delay(1000); // Rate limiting
                }
                catch (error) {
                    // console.error removed for production
                }
            }
        }
        catch (error) {
            // console.error removed for production
        }
    }
    /**
     * Parse RSS feed and extract article data
     */
    async parseRSSFeed(rssContent, source) {
        const $ = cheerio.load(rssContent, { xmlMode: true });
        const articles = [];
        $('item').each((i, element) => {
            const $item = $(element);
            const title = $item.find('title').text().trim();
            const link = $item.find('link').text().trim();
            const description = $item.find('description').text().trim();
            const pubDate = $item.find('pubDate').text().trim();
            if (title && link) {
                articles.push({
                    title,
                    url: link,
                    description,
                    publishedAt: pubDate ? new Date(pubDate) : new Date(),
                    source: source.name
                });
            }
        });
        return articles;
    }
    /**
     * Analyze article content using OpenAI for political intelligence
     */
    async analyzeArticleWithOpenAI(article, source) {
        const prompt = `Analyze this Canadian news article for political intelligence:

Title: ${article.title}
Description: ${article.description}
Source: ${source.name}

Provide comprehensive analysis in JSON format with these fields:
- credibilityScore: number (0-100, based on source reputation and content quality)
- sentimentScore: number (-1 to 1, negative to positive)
- biasRating: string (left, center-left, center, center-right, right)
- keyTopics: array of strings (main political topics)
- politicalImpact: number (0-100, potential impact on Canadian politics)
- factCheck: string (assessment of factual accuracy)
- summary: string (concise 2-sentence summary)
- publicImpact: number (0-100, impact on public opinion)`;
        try {
            const responseText = await aiService.generateResponse(prompt);
            const analysis = JSON.parse(responseText);
            return {
                title: article.title,
                content: article.description,
                url: article.url,
                author: "Staff Reporter", // Default for RSS feeds
                publishedAt: article.publishedAt,
                source: source.name,
                credibilityScore: Math.max(0, Math.min(100, analysis.credibilityScore || 75)),
                sentimentScore: Math.max(-1, Math.min(1, analysis.sentimentScore || 0)),
                biasRating: analysis.biasRating || "center",
                keyTopics: Array.isArray(analysis.keyTopics) ? analysis.keyTopics : ["Politics"],
                politicalImpact: Math.max(0, Math.min(100, analysis.politicalImpact || 50)),
                factCheck: analysis.factCheck || "Pending verification",
                summary: analysis.summary || "Canadian political news article",
                publicImpact: Math.max(0, Math.min(100, analysis.publicImpact || 50))
            };
        }
        catch (error) {
            // console.error removed for production
            // Fallback analysis without AI
            return {
                title: article.title,
                content: article.description,
                url: article.url,
                author: "Staff Reporter",
                publishedAt: article.publishedAt,
                source: source.name,
                credibilityScore: 75,
                sentimentScore: 0,
                biasRating: "center",
                keyTopics: ["Politics"],
                politicalImpact: 50,
                factCheck: "Analysis pending",
                summary: article.title,
                publicImpact: 50
            };
        }
    }
    /**
     * Store analyzed article in database
     */
    async storeAnalyzedArticle(article) {
        try {
            await db.insert(newsArticles).values({
                title: article.title,
                content: article.content,
                source: article.source,
                author: article.author,
                url: article.url,
                publishedAt: article.publishedAt,
                credibilityScore: article.credibilityScore.toString(),
                sentimentScore: article.sentimentScore,
                bias: article.biasRating,
                keyTopics: article.keyTopics,
                publicImpact: article.publicImpact,
                summary: article.summary
            });
        }
        catch (error) {
            // console.error removed for production
        }
    }
    /**
     * Get latest analyzed news for dashboard
     */
    async getLatestNews(limit = 10) {
        try {
            const articles = await db
                .select()
                .from(newsArticles)
                .orderBy(desc(newsArticles.publishedAt))
                .limit(limit);
            return articles.map(article => ({
                ...article,
                keyTopics: typeof article.keyTopics === 'string'
                    ? JSON.parse(article.keyTopics)
                    : article.keyTopics || []
            }));
        }
        catch (error) {
            // console.error removed for production
            return [];
        }
    }
    /**
     * Get news analytics for dashboard
     */
    async getNewsAnalytics() {
        try {
            const articles = await db.select().from(newsArticles);
            if (!articles.length) {
                return {
                    totalArticles: 0,
                    averageCredibility: 0,
                    averageSentiment: 0,
                    sourceDistribution: [],
                    topTopics: [],
                    biasDistribution: []
                };
            }
            const totalArticles = articles.length;
            const averageCredibility = articles.reduce((sum, a) => sum + (Number(a.credibilityScore) || 0), 0) / totalArticles;
            const averageSentiment = articles.reduce((sum, a) => sum + (a.sentimentScore || 0), 0) / totalArticles;
            // Source distribution
            const sourceMap = new Map();
            articles.forEach(article => {
                const source = article.source || 'Unknown';
                sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
            });
            const sourceDistribution = Array.from(sourceMap.entries()).map(([source, count]) => ({
                source,
                count,
                percentage: Math.round((count / totalArticles) * 100)
            }));
            // Top topics
            const topicMap = new Map();
            articles.forEach(article => {
                const topics = typeof article.keyTopics === 'string'
                    ? JSON.parse(article.keyTopics || '[]')
                    : article.keyTopics || [];
                topics.forEach((topic) => {
                    topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
                });
            });
            const topTopics = Array.from(topicMap.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([topic, count]) => ({ topic, count }));
            // Bias distribution
            const biasMap = new Map();
            articles.forEach(article => {
                const bias = article.bias || 'center';
                biasMap.set(bias, (biasMap.get(bias) || 0) + 1);
            });
            const biasDistribution = Array.from(biasMap.entries()).map(([bias, count]) => ({
                bias,
                count,
                percentage: Math.round((count / totalArticles) * 100)
            }));
            return {
                totalArticles,
                averageCredibility: Math.round(averageCredibility),
                averageSentiment: Math.round(averageSentiment * 100) / 100,
                sourceDistribution,
                topTopics,
                biasDistribution
            };
        }
        catch (error) {
            // console.error removed for production
            return {
                totalArticles: 0,
                averageCredibility: 0,
                averageSentiment: 0,
                sourceDistribution: [],
                topTopics: [],
                biasDistribution: []
            };
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
export const revolutionaryNewsAggregator = new RevolutionaryNewsAggregator();
