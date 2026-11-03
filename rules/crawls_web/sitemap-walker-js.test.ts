// lexcode-expect: 3
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';

export async function walkRegex(sitemapUrl: string) {
  const xml = await (await fetch(sitemapUrl)).text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const pages: string[] = [];
  for (const u of urls) {
    const res = await fetch(u);
    pages.push(await res.text());
  }
  return pages;
}

export async function walkXml2js(sitemapUrl: string) {
  const xml = await (await fetch(sitemapUrl)).text();
  const parsed = await parseStringPromise(xml);
  for (const entry of parsed.urlset.url) {
    await fetch(entry.loc[0]);
  }
}

export async function walkCheerio(xml: string) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const locs = $('loc')
    .map((_, el) => $(el).text())
    .get();
  for (const l of locs) {
    await fetch(l);
  }
}
