// lexcode-expect: 0
import { readFileSync, writeFileSync } from 'node:fs';
import Parser from 'rss-parser';
import RSS from 'rss';
import { Feed } from 'feed';

// Generates the project's OWN feed from its own posts: a writer, not a reader.
export function buildFeed(posts: { title: string; slug: string; body: string; date: Date }[]) {
  const feed = new Feed({
    title: 'Our blog',
    id: 'https://blog.example.org/',
    link: 'https://blog.example.org/',
    copyright: 'All rights reserved, the authors',
  });
  for (const post of posts) {
    feed.addItem({ title: post.title, id: post.slug, link: `https://blog.example.org/${post.slug}`, date: post.date, description: post.body });
  }
  writeFileSync('public/rss.xml', feed.rss2());
}

export function buildWithRssPackage(posts: { title: string; url: string }[]) {
  const rss = new RSS({ title: 'Our changelog', feed_url: 'https://example.org/changelog.xml', site_url: 'https://example.org' });
  for (const p of posts) rss.item({ title: p.title, url: p.url, description: '' });
  return rss.xml();
}

// Parses a local file of the project's own posts. No URL is fetched.
export async function readLocalPosts() {
  const parser = new Parser();
  const feed = await parser.parseString(readFileSync('./content/posts.xml', 'utf8'));
  return feed.items.map((i) => i.title);
}

// Reads the project's own feed back from the dev server, to check it.
export async function selfCheck() {
  const parser = new Parser();
  const feed = await parser.parseURL('http://localhost:3000/rss.xml');
  return feed.items.length;
}
