// lexcode-expect: 0
import * as Sentry from '@sentry/node';
import pino from 'pino';
import Cookies from 'js-cookie';

const logger = pino();

// Server-side error logging.
export function reportFailure(err, req) {
  logger.error({ err, path: req.path }, 'request failed');
  Sentry.captureException(err);
  console.error('request failed', err.message);
}

// A first-party session cookie and a theme preference kept on the device.
export function remember(theme) {
  localStorage.setItem('theme', theme);
  Cookies.set('theme', theme, { sameSite: 'lax' });
}

export function readTheme() {
  return localStorage.getItem('theme') || 'light';
}

// Consent mode defaults only restrict storage; no hit is sent.
function gtag() { window.dataLayer.push(arguments); }
gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });

// The app's own metrics module, with the same method names but no third party behind it.
const metrics = {
  track: (name) => counters.set(name, (counters.get(name) || 0) + 1),
  capture: (name) => counters.get(name),
  identify: (id) => id,
};
const counters = new Map();
metrics.track('requests_served');
metrics.capture('requests_served');

// A local object named analytics that is not Segment: no import of its library here.
export const analytics = { page: () => 'about', track: () => 'x', identify: () => 'y' };
export const pageName = analytics.page();
