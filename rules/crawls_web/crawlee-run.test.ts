// lexcode-expect: 3
import { CheerioCrawler, PlaywrightCrawler, Dataset } from 'crawlee';

const crawler = new CheerioCrawler({
  maxRequestsPerCrawl: 500,
  async requestHandler({ request, $, enqueueLinks }) {
    await Dataset.pushData({ url: request.url, title: $('title').text() });
    // Follow every link on the page: this is what makes it a crawl.
    await enqueueLinks();
  },
});

export async function crawlDocs() {
  await crawler.run(['https://docs.example.com/']);
}

export async function crawlShop() {
  const shop = new PlaywrightCrawler({
    async requestHandler({ page, request }) {
      const price = await page.locator('.price').first().textContent();
      await Dataset.pushData({ url: request.url, price });
    },
  });
  await shop.run(['https://shop.example.org/catalog']);
}

export async function seedLater(urls: string[]) {
  const late = new CheerioCrawler({ requestHandler: async () => {} });
  await late.addRequests(urls);
  return late;
}
