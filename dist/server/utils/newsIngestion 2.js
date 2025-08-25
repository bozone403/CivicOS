import * as cheerio from 'cheerio';
import { db } from '../db.js';
import { newsArticles } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
const FEEDS = [
    { name: 'CBC Politics', url: 'https://www.cbc.ca/cmlink/rss-politics', category: 'politics' },
    { name: 'CTV Politics', url: 'https://www.ctvnews.ca/rss/politics/ctvnews-ca-politics-public-rss-1.822301', category: 'politics' },
    { name: 'Global News Politics', url: 'https://globalnews.ca/politics/feed/', category: 'politics' },
];
async function fetchFeed(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'CivicOSBot/1.0 (+https://civicos.ca)' } });
    if (!res.ok)
        throw new Error(`Failed to fetch feed ${url}: ${res.status}`);
    return await res.text();
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
    for (const feed of FEEDS) {
        try {
            const xml = await fetchFeed(feed.url);
            const items = parseRss(xml);
            for (const item of items) {
                try {
                    // Skip if URL already exists (unique)
                    const existing = await db.select().from(newsArticles).where(eq(newsArticles.url, item.link)).limit(1);
                    if (existing.length > 0) {
                        skipped++;
                        continue;
                    }
                    await db.insert(newsArticles).values({
                        title: item.title.slice(0, 512),
                        content: item.description || null,
                        url: item.link,
                        source: feed.name,
                        author: null,
                        category: feed.category,
                        publishedAt: item.pubDate ? new Date(item.pubDate) : null,
                        summary: item.description || null,
                    });
                    inserted++;
                }
                catch {
                    skipped++;
                }
            }
        }
        catch {
            // Continue other feeds
        }
    }
    return { inserted, skipped };
}
