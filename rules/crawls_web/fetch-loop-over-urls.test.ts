// lexcode-expect: 4
import axios from 'axios';

export async function pullPages(urls: string[]) {
  const pages: string[] = [];
  for (const url of urls) {
    const res = await fetch(url);
    pages.push(await res.text());
  }
  return pages;
}

export async function pullAll(urls: string[]) {
  return Promise.all(urls.map((u) => fetch(u)));
}

export async function pullAxios(links: string[]) {
  const pages = await Promise.all(
    links.map(async (l) => {
      const r = await axios.get(l, { timeout: 5000 });
      return r.data;
    }),
  );
  return pages;
}

export async function pullEach(urls: string[]) {
  urls.forEach(async (u) => {
    await fetch(u);
  });
}
