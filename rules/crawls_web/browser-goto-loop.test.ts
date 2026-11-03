// lexcode-expect: 3
import { chromium } from 'playwright';
import puppeteer from 'puppeteer';

export async function collectArticles(urls: string[]) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const articles: string[] = [];
  for (const url of urls) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    articles.push(await page.innerText('article'));
  }
  await browser.close();
  return articles;
}

export async function pagedListing() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const rows: string[] = [];
  for (let n = 1; n <= 40; n++) {
    await page.goto(`https://listings.example.org/results?page=${n}`);
    rows.push(...(await page.$$eval('li.result', (els) => els.map((e) => e.textContent ?? ''))));
  }
  return rows;
}

export async function viaForEach(links: string[]) {
  const browser = await puppeteer.launch();
  const tab = await browser.newPage();
  links.forEach(async (link) => {
    await tab.goto(link);
  });
}
