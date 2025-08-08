import { Router } from "express";
import { db } from "../db.js";
import { politicians, bills, legalActs, newsArticles } from "../../shared/schema.js";
import { or, like } from "drizzle-orm";
const router = Router();
// Simple search endpoint that returns basic results
router.get('/', async (req, res) => {
    try {
        const { q: query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.json({
                query: '',
                results: [],
                total: 0
            });
        }
        const searchTerm = query.toLowerCase().trim();
        if (searchTerm.length < 2) {
            return res.json({
                query: searchTerm,
                results: [],
                total: 0
            });
        }
        const results = [];
        try {
            // Search politicians
            const politiciansRows = await db
                .select()
                .from(politicians)
                .where(or(like(politicians.name, `%${searchTerm}%`), like(politicians.party, `%${searchTerm}%`), like(politicians.constituency, `%${searchTerm}%`)))
                .limit(5);
            politiciansRows.forEach((politician) => {
                results.push({
                    id: politician.id.toString(),
                    type: 'politician',
                    title: politician.name,
                    description: `${politician.party || 'Independent'} - ${politician.constituency || politician.jurisdiction}`,
                    url: `/politicians/${politician.id}`,
                    relevance: calculateRelevance(searchTerm, politician.name)
                });
            });
            // Search bills
            const billsRows = await db
                .select()
                .from(bills)
                .where(or(like(bills.title, `%${searchTerm}%`), like(bills.description, `%${searchTerm}%`)))
                .limit(5);
            billsRows.forEach((bill) => {
                results.push({
                    id: bill.id.toString(),
                    type: 'bill',
                    title: bill.title,
                    description: bill.description?.substring(0, 100) + '...' || 'No description available',
                    url: `/voting/${bill.id}`,
                    relevance: calculateRelevance(searchTerm, bill.title)
                });
            });
            // Search legal acts
            const actsRows = await db
                .select()
                .from(legalActs)
                .where(or(like(legalActs.title, `%${searchTerm}%`), like(legalActs.fullText, `%${searchTerm}%`)))
                .limit(5);
            actsRows.forEach((act) => {
                results.push({
                    id: act.id.toString(),
                    type: 'legal',
                    title: act.title,
                    description: act.summary?.substring(0, 100) + '...' || 'Legal document',
                    url: `/legal/${act.id}`,
                    relevance: calculateRelevance(searchTerm, act.title)
                });
            });
            // Search news articles
            const newsRows = await db
                .select()
                .from(newsArticles)
                .where(or(like(newsArticles.title, `%${searchTerm}%`), like(newsArticles.content, `%${searchTerm}%`)))
                .limit(5);
            newsRows.forEach((article) => {
                results.push({
                    id: article.id.toString(),
                    type: 'news',
                    title: article.title,
                    description: article.content?.substring(0, 100) + '...' || 'News article',
                    url: `/news/${article.id}`,
                    relevance: calculateRelevance(searchTerm, article.title)
                });
            });
        }
        catch (dbError) {
            // console.error removed for production
            // Return empty results if database search fails
        }
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        res.json({
            query: searchTerm,
            results,
            total: results.length
        });
    }
    catch (error) {
        // console.error removed for production
        res.status(500).json({
            error: 'Search failed',
            message: 'An error occurred while performing the search'
        });
    }
});
function calculateRelevance(searchTerm, text) {
    const textLower = text.toLowerCase();
    const termLower = searchTerm.toLowerCase();
    // Exact match gets highest score
    if (textLower.includes(termLower)) {
        return 100;
    }
    // Partial match gets medium score
    const words = termLower.split(' ');
    const matchingWords = words.filter(word => textLower.includes(word)).length;
    return (matchingWords / words.length) * 50;
}
export default router;
