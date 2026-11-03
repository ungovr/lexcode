// lexcode-expect: 0
import { writeFileSync } from 'node:fs';

// Generates the project's OWN sitemap from its route list. Nothing is fetched.
export function writeSitemap(base: string, paths: string[]) {
  const body = paths.map((p) => `<url><loc>${base}${p}</loc></url>`).join('\n');
  writeFileSync('public/sitemap.xml', `<?xml version="1.0"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
}

// Counts the entries of a sitemap string the project built. No request is made.
export function countLocs(xml: string) {
  return [...xml.matchAll(/<loc>/g)].length;
}

// A regex match whose result is passed to the project's own API, not to a URL fetch.
export async function lookup(text: string, ids: Record<string, number>) {
  const m = text.match(/id-(\d+)/);
  if (m) {
    return fetch(`/api/items/${ids[m[1]]}`);
  }
}
