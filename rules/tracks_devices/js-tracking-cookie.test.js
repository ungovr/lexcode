// lexcode-expect: 4
import Cookies from 'js-cookie';
import { cookies } from 'next/headers';
import express from 'express';

const app = express();

// Gives each first-time visitor a long-lived id so later visits can be joined up.
app.use((req, res, next) => {
  if (!req.cookies.visitor_id) {
    res.cookie('visitor_id', crypto.randomUUID(), { maxAge: 1000 * 60 * 60 * 24 * 730, httpOnly: false });
  }
  next();
});

// Re-creates the advertising cookies on the first-party domain.
export function copyAdCookies(clickId) {
  Cookies.set('_fbp', `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`, { expires: 90 });
  document.cookie = `_ga=GA1.2.${clickId}; max-age=63072000; path=/`;
}

export async function tagServerSide(id) {
  (await cookies()).set('ajs_anonymous_id', id, { maxAge: 31536000 });
}
