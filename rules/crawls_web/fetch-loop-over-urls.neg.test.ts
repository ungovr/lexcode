// lexcode-expect: 0
import axios from 'axios';

// The project's own API, with a built URL per id: the loop variable is an id, not a URL.
export async function ownItems(ids: number[]) {
  const items = [];
  for (const id of ids) {
    const res = await fetch(`/api/items/${id}`);
    items.push(await res.json());
  }
  return items;
}

export async function ownLoopback(ids: number[]) {
  return Promise.all(ids.map((id) => fetch('http://localhost:3000/api/items/' + id)));
}

export async function ownAxios(ids: number[]) {
  const api = axios.create({ baseURL: 'http://127.0.0.1:4000' });
  const out = [];
  for (const id of ids) {
    out.push((await api.get(`/things/${id}`)).data);
  }
  return out;
}

// A single documented partner API call.
export async function repoInfo() {
  const res = await fetch('https://api.github.com/repos/vercel/next.js', { headers: { Accept: 'application/vnd.github+json' } });
  return res.json();
}

// A loop whose values never reach an HTTP client.
export function slugs(urls: string[]) {
  const out: string[] = [];
  for (const url of urls) {
    out.push(new URL(url).pathname);
    console.log(url);
  }
  return urls.map((u) => encodeURIComponent(u));
}

export function cachedLookup(cache: Map<string, string>, urls: string[]) {
  return urls.map((u) => cache.get(u));
}
