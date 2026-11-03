// lexcode-expect: 0
// Error reporting and performance timing, which do not replay what users type,
// and a local object with an init method.
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';

const registry = {
  init(name: string): string {
    return `registered ${name}`;
  },
};

export function ErrorBoot() {
  useEffect(() => {
    Sentry.init({ dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0', tracesSampleRate: 0.1 });
    performance.mark('app-ready');
    registry.init('FullStory');
  }, []);
  return null;
}
