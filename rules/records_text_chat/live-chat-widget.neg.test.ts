// lexcode-expect: 0
// Chat-vendor look-alikes that receive no typed text: shutting a widget down,
// reading a version, our own in-app assistant, and a script from another host.
declare global {
  interface Window {
    Intercom: (...args: unknown[]) => void;
    zE: (...args: unknown[]) => void;
  }
}

export function stopIntercom(): void {
  window.Intercom('shutdown');
}

export function widgetVersion(): string {
  return String(window.zE ? 'loaded' : 'absent');
}

export function loadMaps(key: string): void {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
  document.head.appendChild(script);
}

export function loadAnalyticsBundle(): void {
  const script = document.createElement('script');
  script.src = '/static/vendor/chart.min.js';
  document.head.appendChild(script);
}

export function localDrift(items: string[]): string[] {
  const drift = { load: (xs: string[]) => xs.slice() };
  return drift.load(items);
}

export function askOwnAssistant(question: string): Promise<Response> {
  // Our own endpoint answers; no chat vendor receives the text.
  return fetch('/api/assistant', { method: 'POST', body: JSON.stringify({ question }) });
}
