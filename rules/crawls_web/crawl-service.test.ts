// lexcode-expect: 3
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function mirrorDocs() {
  // Asks the scraping service to crawl a whole site and hand back every page.
  const job = await firecrawl.crawlUrl('https://docs.example.com', { limit: 200, scrapeOptions: { formats: ['markdown'] } });
  return job;
}

export async function listSite(site: string) {
  return firecrawl.mapUrl(site);
}

export async function batch(urls: string[]) {
  return firecrawl.batchScrapeUrls(urls, { formats: ['markdown'] });
}
