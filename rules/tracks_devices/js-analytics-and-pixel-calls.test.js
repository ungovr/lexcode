// lexcode-expect: 15
import posthog from 'posthog-js';
import mixpanel from 'mixpanel-browser';
import * as amplitude from '@amplitude/analytics-browser';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { getAnalytics } from 'firebase/analytics';

const analytics = AnalyticsBrowser.load({ writeKey: process.env.NEXT_PUBLIC_SEGMENT_KEY });

// Google tag, as injected by the site's header snippet.
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-ABC123XYZ', { anonymize_ip: true });

export function trackSignup(plan) {
  gtag('event', 'sign_up', { plan });
  window.gtag('event', 'sign_up_complete', { plan });
}

// Meta Pixel.
export function startMetaPixel() {
  fbq('init', '123456789012345');
  fbq('track', 'PageView');
}

// PostHog, Mixpanel and Amplitude each follow the visitor with their own id.
export function startProductAnalytics(user) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, { api_host: 'https://us.i.posthog.com' });
  posthog.capture('$pageview');
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN);
  mixpanel.track('Viewed pricing');
  amplitude.init(process.env.NEXT_PUBLIC_AMPLITUDE_KEY);
  amplitude.track('Clicked checkout', { plan: user.plan });
}

// Segment.
export function identify(user) {
  analytics.identify(user.id, { email: user.email });
  analytics.track('Account created');
}

// Firebase Analytics.
export function startFirebaseAnalytics(app) {
  return getAnalytics(app);
}
