// lexcode-expect: 0
import { test, expect } from '@playwright/test';

// A Playwright test file: the browser visits the project's own pages to check them.
const routes = ['/', '/pricing', '/docs'];

test('every route renders', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
  }
});

// The project's own API, by relative URL and by loopback address.
export async function loadItems(ids: number[]) {
  const items = [];
  for (const id of ids) {
    const res = await fetch(`/api/items/${id}`);
    items.push(await res.json());
  }
  return items;
}

export async function ping() {
  const res = await fetch('http://localhost:3000/api/health');
  return res.ok;
}

// One documented partner API call, not in a loop.
export async function createCharge(amount: number) {
  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ amount: String(amount), currency: 'usd' }),
  });
  return res.json();
}

// A job queue object whose method is called run: not a crawler.
class JobQueue {
  jobs: Array<() => void> = [];
  run() {
    this.jobs.forEach((job) => job());
  }
}

new JobQueue().run();

// Loops that call something other than an HTTP client with each value.
export function names(urls: string[]) {
  const out: string[] = [];
  for (const url of urls) {
    out.push(url.toLowerCase());
    console.log(url);
  }
  return urls.map((u) => encodeURIComponent(u));
}
