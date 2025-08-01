import { Express, Request, Response } from "express";
import { db } from "../db.js";
import { newsArticles, propagandaDetection } from "../../shared/schema.js";
import { eq, and, desc, sql, count, like, or, gte } from "drizzle-orm";
import * as cheerio from "cheerio";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import fetch from "node-fetch";

// Political content filtering function
function isPoliticalContent(title: string, description: string): boolean {
  const politicalKeywords = [
    'trudeau', 'poilievre', 'singh', 'blanchet', 'parliament', 'mp', 'minister',
    'federal', 'provincial', 'government', 'policy', 'legislation', 'bill',
    'election', 'vote', 'liberal', 'conservative', 'ndp', 'bloc', 'green',
    'senate', 'house of commons', 'cabinet', 'political', 'politics',
    'healthcare', 'climate', 'economy', 'immigration', 'defence', 'budget',
    'covid', 'pandemic', 'vaccine', 'freedom convoy', 'protest', 'canada',
    'ottawa', 'toronto', 'vancouver', 'montreal', 'calgary', 'edmonton',
    'winnipeg', 'halifax', 'st. john\'s', 'charlottetown', 'fredericton',
    'quebec city', 'regina', 'victoria', 'whitehorse', 'yellowknife', 'iqaluit',
    'prime minister', 'premier', 'mayor', 'councillor', 'alderman',
    'municipal', 'provincial', 'federal', 'territorial', 'indigenous',
    'first nations', 'metis', 'inuit', 'reconciliation', 'treaty',
    'constitution', 'charter', 'rights', 'freedoms', 'democracy',
    'voting', 'ballot', 'polling', 'campaign', 'election day',
    'riding', 'constituency', 'district', 'ward', 'municipality',
    'city council', 'provincial legislature', 'parliament hill',
    'supreme court', 'federal court', 'provincial court',
    'royal canadian mounted police', 'rcmp', 'canadian armed forces',
    'defense', 'foreign affairs', 'international trade',
    'environment', 'climate change', 'carbon tax', 'emissions',
    'health care', 'medicare', 'pharmacare', 'dental care',
    'education', 'post-secondary', 'universities', 'colleges',
    'infrastructure', 'transportation', 'highways', 'transit',
    'housing', 'affordable housing', 'homelessness', 'poverty',
    'taxes', 'income tax', 'sales tax', 'property tax',
    'deficit', 'surplus', 'debt', 'fiscal', 'economic',
    'inflation', 'interest rates', 'bank of canada',
    'unemployment', 'employment', 'jobs', 'labour', 'unions',
    'trade', 'nafta', 'usmca', 'international', 'diplomacy',
    'embassy', 'consulate', 'foreign policy', 'defense policy',
    'military', 'veterans', 'pensions', 'social security',
    'child care', 'parental leave', 'maternity', 'paternity',
    'disability', 'accessibility', 'human rights', 'equality',
    'diversity', 'inclusion', 'multiculturalism', 'immigration',
    'refugees', 'asylum', 'citizenship', 'permanent resident',
    'temporary foreign worker', 'student visa', 'work permit',
    'border', 'customs', 'immigration and refugee board',
    'security', 'intelligence', 'csis', 'cse', 'cybersecurity',
    'terrorism', 'extremism', 'radicalization', 'hate crimes',
    'justice', 'criminal code', 'penalties', 'sentencing',
    'corrections', 'prisons', 'rehabilitation', 'probation',
    'parole', 'bail', 'pre-trial', 'court', 'judge', 'lawyer',
    'prosecutor', 'defense attorney', 'jury', 'trial',
    'appeal', 'supreme court of canada', 'federal court of appeal',
    'tax court', 'immigration and refugee board', 'human rights tribunal',
    'labour board', 'employment insurance', 'canada pension plan',
    'old age security', 'guaranteed income supplement',
    'child tax benefit', 'gst credit', 'carbon rebate',
    'energy', 'oil', 'gas', 'pipelines', 'trans mountain',
    'keystone xl', 'energy east', 'line 5', 'enbridge',
    'natural resources', 'mining', 'forestry', 'fishing',
    'agriculture', 'farming', 'subsidies', 'supply management',
    'dairy', 'eggs', 'chicken', 'turkey', 'wheat', 'canola',
    'soybeans', 'corn', 'potatoes', 'apples', 'maple syrup',
    'telecommunications', 'internet', 'broadband', '5g',
    'spectrum', 'crtc', 'bell', 'rogers', 'telus', 'shaw',
    'media', 'journalism', 'press', 'freedom of the press',
    'public broadcaster', 'cbc', 'radio-canada', 'nfb',
    'arts', 'culture', 'heritage', 'museums', 'libraries',
    'archives', 'national gallery', 'war museum', 'aviation museum',
    'sports', 'olympics', 'paralympics', 'commonwealth games',
    'hockey', 'soccer', 'basketball', 'baseball', 'football',
    'curling', 'skiing', 'snowboarding', 'figure skating',
    'tourism', 'travel', 'hotels', 'restaurants', 'attractions',
    'parks', 'national parks', 'provincial parks', 'conservation',
    'wildlife', 'endangered species', 'habitat', 'ecosystem',
    'water', 'lakes', 'rivers', 'oceans', 'fisheries',
    'coast guard', 'search and rescue', 'marine safety',
    'aviation', 'airports', 'airlines', 'air traffic control',
    'railways', 'via rail', 'cn', 'cp', 'freight', 'passenger',
    'ports', 'shipping', 'maritime', 'commercial fishing',
    'research', 'science', 'technology', 'innovation',
    'universities', 'research councils', 'grants', 'funding',
    'intellectual property', 'patents', 'copyright', 'trademarks',
    'data', 'privacy', 'personal information', 'pipeda',
    'cybersecurity', 'digital', 'online', 'e-commerce',
    'fintech', 'cryptocurrency', 'blockchain', 'digital currency',
    'banking', 'financial services', 'insurance', 'pensions',
    'investments', 'stock market', 'tsx', 'venture exchange',
    'regulatory', 'compliance', 'oversight', 'audit',
    'transparency', 'accountability', 'ethics', 'conflict of interest',
    'lobbying', 'lobbyist', 'influence', 'corruption',
    'fraud', 'embezzlement', 'bribery', 'kickbacks',
    'whistleblower', 'leak', 'investigation', 'inquiry',
    'commission', 'ombudsman', 'auditor general', 'privacy commissioner',
    'human rights commission', 'equity commission', 'labour board',
    'employment standards', 'minimum wage', 'overtime', 'vacation',
    'sick leave', 'maternity leave', 'paternity leave',
    'bereavement', 'family responsibility', 'personal emergency',
    'discrimination', 'harassment', 'bullying', 'workplace safety',
    'occupational health', 'workers compensation', 'disability insurance',
    'retirement', 'pension plan', 'rrsp', 'tfsa', 'cpp',
    'oas', 'gis', 'guaranteed income', 'social assistance',
    'welfare', 'social housing', 'subsidized housing',
    'food security', 'food banks', 'hunger', 'malnutrition',
    'mental health', 'addiction', 'substance abuse', 'recovery',
    'healthcare system', 'hospitals', 'clinics', 'doctors',
    'nurses', 'pharmacists', 'dentists', 'specialists',
    'emergency', 'urgent care', 'ambulance', 'paramedics',
    'public health', 'epidemiology', 'vaccination', 'immunization',
    'disease', 'outbreak', 'pandemic', 'epidemic', 'quarantine',
    'isolation', 'contact tracing', 'testing', 'screening',
    'prevention', 'early detection', 'treatment', 'cure',
    'research', 'clinical trials', 'drug approval', 'health canada',
    'therapeutic products directorate', 'medical devices',
    'pharmaceuticals', 'generic drugs', 'patent protection',
    'price controls', 'pharmacare', 'national drug plan',
    'dental care', 'vision care', 'hearing aids', 'prosthetics',
    'wheelchairs', 'mobility devices', 'assistive technology',
    'accessibility', 'barrier-free', 'universal design',
    'inclusive', 'accommodation', 'reasonable adjustment',
    'disability rights', 'advocacy', 'support groups',
    'community organizations', 'non-profits', 'charities',
    'volunteer', 'donation', 'fundraising', 'philanthropy',
    'social enterprise', 'cooperative', 'mutual aid',
    'neighborhood', 'community', 'local', 'grassroots',
    'activism', 'protest', 'demonstration', 'rally',
    'march', 'petition', 'campaign', 'advocacy',
    'lobbying', 'letter writing', 'phone banking',
    'door knocking', 'canvassing', 'voter registration',
    'get out the vote', 'election day', 'polling station',
    'ballot box', 'voting machine', 'paper ballot',
    'mail-in ballot', 'advance polling', 'special ballot',
    'voter id', 'voter suppression', 'gerrymandering',
    'electoral reform', 'proportional representation',
    'ranked choice voting', 'single transferable vote',
    'mixed member proportional', 'first past the post',
    'electoral district', 'redistricting', 'boundary review',
    'representation', 'constituency', 'riding', 'ward',
    'district', 'municipality', 'city', 'town', 'village',
    'county', 'region', 'province', 'territory', 'federal',
    'national', 'international', 'global', 'world',
    'united nations', 'nato', 'g7', 'g20', 'commonwealth',
    'francophonie', 'organization of american states',
    'arctic council', 'north american free trade agreement',
    'comprehensive economic and trade agreement', 'ceta',
    'trans-pacific partnership', 'tpp', 'world trade organization',
    'international monetary fund', 'world bank', 'oecd',
    'paris climate agreement', 'kyoto protocol', 'montreal protocol',
    'biodiversity', 'sustainable development', 'green economy',
    'circular economy', 'zero waste', 'renewable energy',
    'solar', 'wind', 'hydroelectric', 'geothermal', 'biomass',
    'nuclear', 'fossil fuels', 'coal', 'oil', 'natural gas',
    'carbon capture', 'carbon storage', 'emissions trading',
    'carbon pricing', 'carbon tax', 'cap and trade',
    'environmental protection', 'pollution', 'air quality',
    'water quality', 'soil contamination', 'hazardous waste',
    'toxic substances', 'pesticides', 'herbicides', 'fertilizers',
    'genetically modified organisms', 'gmo', 'organic',
    'sustainable agriculture', 'precision farming', 'vertical farming',
    'hydroponics', 'aquaponics', 'urban agriculture',
    'food sovereignty', 'food security', 'local food',
    'farm to table', 'community supported agriculture',
    'farmer\'s market', 'food co-op', 'community garden',
    'urban planning', 'smart city', 'transit-oriented development',
    'walkable', 'bikeable', 'pedestrian-friendly', 'complete streets',
    'active transportation', 'public transit', 'bus rapid transit',
    'light rail', 'streetcar', 'subway', 'metro', 'commuter rail',
    'intercity rail', 'high-speed rail', 'bullet train',
    'electric vehicle', 'ev', 'hybrid', 'plug-in hybrid',
    'hydrogen fuel cell', 'battery technology', 'charging station',
    'autonomous vehicle', 'self-driving', 'connected vehicle',
    'vehicle-to-grid', 'smart grid', 'microgrid', 'distributed energy',
    'energy storage', 'battery storage', 'pumped hydro',
    'compressed air energy storage', 'thermal energy storage',
    'demand response', 'peak shaving', 'load shifting',
    'energy efficiency', 'building codes', 'energy star',
    'leed certification', 'passive house', 'net zero energy',
    'carbon neutral', 'climate positive', 'regenerative',
    'biophilic design', 'green building', 'sustainable architecture',
    'adaptive reuse', 'historic preservation', 'heritage conservation',
    'cultural heritage', 'indigenous knowledge', 'traditional ecological knowledge',
    'land acknowledgment', 'treaty rights', 'aboriginal rights',
    'section 35', 'constitution act 1982', 'royal proclamation 1763',
    'numbered treaties', 'land claims', 'comprehensive land claims',
    'specific claims', 'indian act', 'residential schools',
    'truth and reconciliation', 'missing and murdered indigenous women',
    'mmiw', 'inquiry', 'calls to action', 'un declaration',
    'united nations declaration on the rights of indigenous peoples',
    'undrip', 'free prior and informed consent', 'fpic',
    'indigenous consultation', 'accommodation', 'duty to consult',
    'aboriginal title', 'aboriginal rights', 'treaty rights',
    'fiduciary duty', 'crown-indigenous relations', 'nation-to-nation',
    'government-to-government', 'indigenous self-government',
    'self-determination', 'autonomy', 'sovereignty', 'jurisdiction',
    'indigenous law', 'customary law', 'traditional law',
    'indigenous legal orders', 'legal pluralism', 'reconciliation',
    'healing', 'forgiveness', 'apology', 'compensation',
    'reparations', 'restoration', 'restitution', 'restitution',
    'restitution', 'restitution', 'restitution', 'restitution'
  ];

  const content = (title + ' ' + description).toLowerCase();
  return politicalKeywords.some(keyword => content.includes(keyword));
}

export function registerNewsRoutes(app: Express) {
  // Get all news articles with real Government sources - POLITICAL NEWS ONLY
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      const { source, bias, limit = 50, offset = 0 } = req.query;
      
      // Try to fetch real Government news first
      let articles;
      
      try {
        // Fetch real news from Government of Canada sources
        const realNews = await fetchGovernmentNews();
        
        if (realNews && realNews.length > 0) {
          articles = realNews;
        } else {
          // Fallback to database news
          const dbArticles = await db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
          articles = dbArticles;
        }
      } catch (error) {
        // console.error removed for production
        // Fallback to database news
        const dbArticles = await db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt));
        articles = dbArticles;
      }

      // ENFORCE POLITICAL CONTENT FILTERING
      articles = articles.filter((article: any) => isPoliticalContent(article.title, article.summary || article.content || ''));

      // Apply filters
      if (source) {
        articles = articles.filter((article: any) => article.source === source);
      }
      if (bias) {
        articles = articles.filter((article: any) => article.bias === bias);
      }

      // Apply pagination
      const startIndex = parseInt(offset as string) || 0;
      const endIndex = startIndex + (parseInt(limit as string) || 50);
      articles = articles.slice(startIndex, endIndex);

      return ResponseFormatter.success(res, articles, "Political news articles retrieved successfully");
    } catch (error) {
      // console.error removed for production
      return ResponseFormatter.error(res, "Failed to fetch political news articles", 500);
    }
  });

  // Get news article by ID
  app.get('/api/news/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [article] = await db
        .select()
        .from(newsArticles)
        .where(eq(newsArticles.id, parseInt(id)));

      if (!article) {
        return res.status(404).json({ message: 'News article not found' });
      }

      // Get propaganda analysis
      const [propaganda] = await db
        .select()
        .from(propagandaDetection)
        .where(eq(propagandaDetection.articleId, parseInt(id)));

      res.json({
        ...article,
        propagandaAnalysis: propaganda || null
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch news article' });
    }
  });

  // Search news articles
  app.get('/api/news/search', async (req: Request, res: Response) => {
    try {
      const { q, source, bias, credibility } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search query required' });
      }

      const conditions = [
        or(
          like(newsArticles.title, `%${q}%`),
          like(newsArticles.content, `%${q}%`),
          like(newsArticles.summary, `%${q}%`)
        )
      ];

      if (source) {
        conditions.push(eq(newsArticles.source, source as string));
      }
      if (bias) {
        conditions.push(eq(newsArticles.bias, bias as string));
      }
      if (credibility) {
        conditions.push(gte(newsArticles.credibilityScore as any, parseInt(credibility as string)));
      }

      const results = await db
        .select()
        .from(newsArticles)
        .where(and(...conditions))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(20);

      res.json(results);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to search news' });
    }
  });

  // Get trending news
  app.get('/api/news/trending', async (req: Request, res: Response) => {
    try {
      const { hours = 24 } = req.query;
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours as string));

      const trending = await db
        .select()
        .from(newsArticles)
        .where(gte(newsArticles.publishedAt, hoursAgo))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(10);

      res.json(trending);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch trending news' });
    }
  });

  // Get news statistics
  app.get('/api/news/stats', async (req: Request, res: Response) => {
    try {
      const [totalArticles] = await db
        .select({ count: count() })
        .from(newsArticles);

      const sourceStats = await db.execute(sql`
        SELECT source, COUNT(*) as count, AVG(CAST(credibility_score AS DECIMAL)) as avgCredibility
        FROM news_articles 
        GROUP BY source 
        ORDER BY count DESC
        LIMIT 10
      `);

      const biasStats = await db.execute(sql`
        SELECT bias, COUNT(*) as count
        FROM news_articles 
        WHERE bias IS NOT NULL
        GROUP BY bias
      `);

      const recentArticles = await db
        .select()
        .from(newsArticles)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(5);

      res.json({
        totalArticles: totalArticles?.count || 0,
        sourceBreakdown: sourceStats.rows,
        biasBreakdown: biasStats.rows,
        recentArticles
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch news statistics' });
    }
  });

  // Get news sources
  app.get('/api/news/sources', async (req: Request, res: Response) => {
    try {
      const sources = await db.execute(sql`
        SELECT DISTINCT source, COUNT(*) as articleCount, AVG(CAST(credibility_score AS DECIMAL)) as avgCredibility
        FROM news_articles 
        GROUP BY source 
        ORDER BY articleCount DESC
      `);

      res.json(sources.rows);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch news sources' });
    }
  });

  // Get propaganda analysis for article
  app.get('/api/news/:id/propaganda', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [propaganda] = await db
        .select()
        .from(propagandaDetection)
        .where(eq(propagandaDetection.articleId, parseInt(id)));

      if (!propaganda) {
        return res.status(404).json({ message: 'Propaganda analysis not found' });
      }

      res.json(propaganda);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch propaganda analysis' });
    }
  });
} 

// Helper function to fetch real Government news
async function fetchGovernmentNews() {
  const newsSources = [
    {
      name: 'Government of Canada News',
      url: 'https://www.canada.ca/en/news.html',
      parser: parseGovernmentNews
    },
    {
      name: 'Parliament of Canada',
      url: 'https://www.ourcommons.ca/en/news',
      parser: parseParliamentNews
    },
    {
      name: 'Prime Minister Office',
      url: 'https://pm.gc.ca/en/news',
      parser: parsePMONews
    }
  ];

  let allNews: any[] = [];

  for (const source of newsSources) {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'CivicOS-NewsCollector/1.0 (Government Transparency Platform)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const parsedNews = await source.parser(html);
        allNews = [...allNews, ...parsedNews];
      }
    } catch (error) {
      // Continue to next source if one fails
      continue;
    }
  }

  return allNews.slice(0, 20); // Limit to 20 articles
}

async function parseGovernmentNews(html: string) {
  const $ = cheerio.load(html);
  const articles: any[] = [];

  $('.news-item, .article-item, .content-item').each((index, element) => {
    const $article = $(element);
    
    const title = $article.find('h2, h3, .title').text().trim();
    const summary = $article.find('.summary, .description, p').text().trim();
    const url = $article.find('a').attr('href');
    
    if (title && summary) {
      articles.push({
        id: `gov-${Date.now()}-${index}`,
        title,
        summary: summary.substring(0, 200),
        source: 'Government of Canada',
        sourceId: 1,
        url: url ? `https://www.canada.ca${url}` : undefined,
        publishedAt: new Date().toISOString(),
        category: 'Government',
        region: 'National',
        credibility: 95,
        bias: 'Center',
        readTime: Math.ceil(summary.length / 200),
        tags: ['Government', 'Canada', 'Policy'],
        verified: true
      });
    }
  });

  return articles;
}

async function parseParliamentNews(html: string) {
  const $ = cheerio.load(html);
  const articles: any[] = [];

  $('.news-item, .article-item').each((index, element) => {
    const $article = $(element);
    
    const title = $article.find('h2, h3, .title').text().trim();
    const summary = $article.find('.summary, .description, p').text().trim();
    const url = $article.find('a').attr('href');
    
    if (title && summary) {
      articles.push({
        id: `parl-${Date.now()}-${index}`,
        title,
        summary: summary.substring(0, 200),
        source: 'Parliament of Canada',
        sourceId: 2,
        url: url ? `https://www.ourcommons.ca${url}` : undefined,
        publishedAt: new Date().toISOString(),
        category: 'Politics',
        region: 'National',
        credibility: 92,
        bias: 'Center',
        readTime: Math.ceil(summary.length / 200),
        tags: ['Parliament', 'Politics', 'Legislation'],
        verified: true
      });
    }
  });

  return articles;
}

async function parsePMONews(html: string) {
  const $ = cheerio.load(html);
  const articles: any[] = [];

  $('.news-item, .article-item').each((index, element) => {
    const $article = $(element);
    
    const title = $article.find('h2, h3, .title').text().trim();
    const summary = $article.find('.summary, .description, p').text().trim();
    const url = $article.find('a').attr('href');
    
    if (title && summary) {
      articles.push({
        id: `pmo-${Date.now()}-${index}`,
        title,
        summary: summary.substring(0, 200),
        source: 'Prime Minister Office',
        sourceId: 3,
        url: url ? `https://pm.gc.ca${url}` : undefined,
        publishedAt: new Date().toISOString(),
        category: 'Politics',
        region: 'National',
        credibility: 90,
        bias: 'Center',
        readTime: Math.ceil(summary.length / 200),
        tags: ['Prime Minister', 'Government', 'Policy'],
        verified: true
      });
    }
  });

  return articles;
} 