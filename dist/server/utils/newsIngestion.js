import * as cheerio from 'cheerio';
import { db } from '../db.js';
import { newsArticles } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
const FEEDS = [
    { name: 'CBC Politics', url: 'https://www.cbc.ca/cmlink/rss-politics', category: 'politics' },
    { name: 'CTV Politics', url: 'https://www.ctvnews.ca/rss/politics/ctvnews-ca-politics-public-rss-1.822301', category: 'politics' },
    { name: 'Global News Politics', url: 'https://globalnews.ca/politics/feed/', category: 'politics' },
    // Alternative feeds that might be more accessible
    { name: 'CBC News', url: 'https://www.cbc.ca/cmlink/rss-topstories', category: 'politics' },
    { name: 'CTV News', url: 'https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822289', category: 'politics' },
    { name: 'Global News', url: 'https://globalnews.ca/feed/', category: 'politics' },
    { name: 'Toronto Star', url: 'https://www.thestar.com/feed.xml', category: 'politics' },
    { name: 'National Post', url: 'https://nationalpost.com/feed/', category: 'politics' },
];
async function fetchFeed(url) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'CivicOSBot/1.0 (+https://civicos.ca)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            },
            // Add timeout and other options
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        if (!res.ok) {
            console.warn(`Failed to fetch feed ${url}: ${res.status} ${res.statusText}`);
            throw new Error(`Failed to fetch feed ${url}: ${res.status}`);
        }
        const text = await res.text();
        if (!text || text.trim().length === 0) {
            throw new Error(`Empty response from ${url}`);
        }
        return text;
    }
    catch (error) {
        console.warn(`Error fetching ${url}:`, error);
        throw error;
    }
}
function parseRss(xml) {
    const $ = cheerio.load(xml, { xmlMode: true });
    const items = [];
    $('item').each((_, el) => {
        const title = $(el).find('title').first().text().trim();
        const link = $(el).find('link').first().text().trim();
        const pubDate = $(el).find('pubDate').first().text().trim();
        const description = $(el).find('description').first().text().trim();
        if (title && link)
            items.push({ title, link, pubDate, description });
    });
    return items;
}
export async function ingestNewsFeeds() {
    let inserted = 0;
    let skipped = 0;
    console.log('Starting RSS ingestion...');
    for (const feed of FEEDS) {
        try {
            console.log(`Processing feed: ${feed.name} (${feed.url})`);
            const xml = await fetchFeed(feed.url);
            const items = parseRss(xml);
            console.log(`Parsed ${items.length} items from ${feed.name}`);
            for (const item of items) {
                try {
                    // Skip if URL already exists (unique)
                    const existing = await db.select().from(newsArticles).where(eq(newsArticles.url, item.link)).limit(1);
                    if (existing.length > 0) {
                        skipped++;
                        continue;
                    }
                    const insertResult = await db.insert(newsArticles).values({
                        title: item.title.slice(0, 512),
                        content: item.description || null,
                        url: item.link,
                        source: feed.name,
                        author: null,
                        category: feed.category,
                        publishedAt: item.pubDate ? new Date(item.pubDate) : null,
                        summary: item.description || null,
                    });
                    console.log(`Inserted article: ${item.title} from ${feed.name}`);
                    inserted++;
                }
                catch (insertError) {
                    console.error(`Failed to insert article from ${feed.name}:`, insertError);
                    skipped++;
                }
            }
        }
        catch (feedError) {
            console.error(`Failed to process feed ${feed.name}:`, feedError);
            // Continue other feeds
        }
    }
    console.log(`RSS ingestion completed: ${inserted} inserted, ${skipped} skipped`);
    return { inserted, skipped };
}
