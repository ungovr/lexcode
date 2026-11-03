// lexcode-expect: 5
// Booting a live-chat or help-desk widget in page code: from here the vendor
// receives what visitors type to the support team.
declare global {
  interface Window {
    Intercom: (...args: unknown[]) => void;
    CRISP_WEBSITE_ID: string;
    zE: (...args: unknown[]) => void;
    fcWidget: { init: (options: object) => void };
    drift: { load: (id: string) => void };
  }
}

export function startIntercom(appId: string, user: { id: string; email: string }): void {
  window.Intercom('boot', { app_id: appId, user_id: user.id, email: user.email });
}

export function startCrisp(websiteId: string): void {
  window.CRISP_WEBSITE_ID = websiteId;
  const script = document.createElement('script');
  script.src = 'https://client.crisp.chat/l.js';
  script.async = true;
  document.head.appendChild(script);
}

export function startZendesk(): void {
  window.zE('messenger', 'show');
}

export function startFreshchat(token: string, host: string): void {
  window.fcWidget.init({ token, host });
}

export function startDrift(id: string): void {
  window.drift.load(id);
}
