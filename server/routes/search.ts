import { Router } from "express";
import { storage } from "../storage.js";
import { db } from "../db.js";

const router = Router();

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  relevance: number;
}

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

    const results: SearchResult[] = [];

    try {
      // Search politicians
      const politicians = await db.query.politicians.findMany({
        where: (politicians, { or, like }) => 
          or(
            like(politicians.name, `%${searchTerm}%`),
            like(politicians.party, `%${searchTerm}%`),
            like(politicians.constituency, `%${searchTerm}%`)
          ),
        limit: 5
      });

      politicians.forEach(politician => {
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
      const bills = await db.query.bills.findMany({
        where: (bills, { or, like }) => 
          or(
            like(bills.title, `%${searchTerm}%`),
            like(bills.description, `%${searchTerm}%`)
          ),
        limit: 5
      });

      bills.forEach(bill => {
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
      const legalActs = await db.query.legalActs.findMany({
        where: (acts, { or, like }) => 
          or(
            like(acts.title, `%${searchTerm}%`),
            like(acts.fullText, `%${searchTerm}%`)
          ),
        limit: 5
      });

      legalActs.forEach(act => {
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
      const news = await db.query.newsArticles.findMany({
        where: (articles, { or, like }) => 
          or(
            like(articles.title, `%${searchTerm}%`),
            like(articles.content, `%${searchTerm}%`)
          ),
        limit: 5
      });

      news.forEach(article => {
        results.push({
          id: article.id.toString(),
          type: 'news',
          title: article.title,
          description: article.content?.substring(0, 100) + '...' || 'News article',
          url: `/news/${article.id}`,
          relevance: calculateRelevance(searchTerm, article.title)
        });
      });

    } catch (dbError) {
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

  } catch (error) {
    // console.error removed for production
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while performing the search'
    });
  }
});

function calculateRelevance(searchTerm: string, text: string): number {
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