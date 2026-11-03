// lexcode-expect: 0
import Cookies from 'js-cookie';
import { cookies } from 'next/headers';
import express from 'express';
import session from 'express-session';
import csrf from 'csurf';

const app = express();

// A first-party session cookie and a CSRF token keep one visit working.
app.use(session({ name: 'sid', secret: process.env.SESSION_SECRET, cookie: { httpOnly: true, sameSite: 'lax' } }));
app.use(csrf({ cookie: { key: '_csrf', httpOnly: true } }));

// A theme and a language preference remembered on the device.
export function savePreferences(theme, locale) {
  Cookies.set('theme', theme, { expires: 365 });
  document.cookie = `locale=${locale}; path=/; max-age=31536000`;
}

export async function setSessionServerSide(token) {
  (await cookies()).set('session', token, { httpOnly: true, secure: true, maxAge: 3600 });
}

app.post('/logout', (req, res) => {
  res.clearCookie('sid');
  res.cookie('flash', 'Signed out', { maxAge: 5000 });
  res.redirect('/');
});

// Reading a cookie that another system set is not writing one.
export function readTheme() {
  return Cookies.get('theme') ?? 'light';
}
