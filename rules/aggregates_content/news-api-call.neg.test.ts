// lexcode-expect: 0
import axios from 'axios';
import { writeFileSync } from 'node:fs';

// The project's own news posts, served from its own API.
export async function ownPosts() {
  const res = await fetch('/api/news');
  return res.json();
}

export async function ownPostsAbsolute() {
  const { data } = await axios.get('http://localhost:3000/api/news/latest');
  return data;
}

// A single documented partner API call for something other than news content.
export async function exchangeRate() {
  const res = await fetch('https://api.exchangerate.host/latest?base=USD');
  return res.json();
}

// A word that happens to be in the code: a local variable and a method on an unrelated object.
const everything = { v1: { topHeadlines: 'not a call' } };
export function describe() {
  return JSON.stringify(everything);
}

// Writes the project's own feed to disk. No third-party content is read.
export function writeLatest(posts: { title: string; url: string }[]) {
  writeFileSync('public/latest.json', JSON.stringify(posts));
}
