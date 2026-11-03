// lexcode-expect: 0
import { chromium } from 'playwright';

// One launched browser, one page, no loop: a screenshot of a single document.
export async function screenshotInvoice(url: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const png = await page.screenshot({ fullPage: true });
  await browser.close();
  return png;
}

// A page object handed in by a test runner, driving the project's own routes.
export async function smokeRoutes(page: { goto(url: string): Promise<unknown> }, routes: string[]) {
  for (const route of routes) {
    await page.goto(route);
  }
}

// A loop in which nothing opens a page.
export async function titles(pages: Array<{ title(): Promise<string> }>) {
  const out: string[] = [];
  for (const p of pages) {
    out.push(await p.title());
  }
  return out;
}

// A launched browser looping over the project's own pages on loopback, to take screenshots.
export async function shootLocalPages(port: number, paths: string[]) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const shots = [];
  for (const path of paths) {
    await page.goto(`http://localhost:${port}${path}`);
    shots.push(await page.screenshot());
  }
  await browser.close();
  return shots;
}
