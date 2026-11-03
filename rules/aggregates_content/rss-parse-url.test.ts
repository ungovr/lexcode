// lexcode-expect: 3
import Parser from 'rss-parser';
import { db } from './db';

const parser = new Parser({ timeout: 10000 });

// Reads a publisher's feed and stores the headlines and links.
export async function refreshHeadlines() {
  const feed = await parser.parseURL('https://www.example-times.com/rss/world.xml');
  for (const item of feed.items) {
    await db.headlines.upsert({ url: item.link, title: item.title, snippet: item.contentSnippet, publishedAt: item.isoDate });
  }
}

// The feed URLs come from a table of sources the operator curates.
export async function refreshAll(sources: { url: string }[]) {
  const out = [];
  for (const source of sources) {
    const feed = await parser.parseURL(source.url);
    out.push(...feed.items.slice(0, 10));
  }
  return out;
}

export async function fromQuery(feedUrl: string) {
  const { items } = await new Parser().parseURL(feedUrl);
  return items.map((i) => ({ title: i.title, link: i.link }));
}
