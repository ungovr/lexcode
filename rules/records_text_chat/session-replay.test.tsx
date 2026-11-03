// lexcode-expect: 4
// Starting a session-replay tool in a React app. Replay vendors record page
// activity, which can include what users type, so a match is only worth a look.
import { useEffect } from 'react';
import LogRocket from 'logrocket';
import * as FullStory from '@fullstory/browser';
import Hotjar from '@hotjar/browser';
import Clarity from '@microsoft/clarity';

export function ReplayBoot({ user }: { user: { id: string; email: string } }) {
  useEffect(() => {
    LogRocket.init('acme/web-app');
    LogRocket.identify(user.id, { email: user.email });
    FullStory.init({ orgId: 'ABC123' });
    Hotjar.init(3000000, 6);
    Clarity.init('abcdefghij');
  }, [user]);
  return null;
}
