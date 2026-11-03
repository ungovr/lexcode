// lexcode-expect: 3
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import ClientJS from 'clientjs';

// Builds a stable visitor id from browser signals, with no cookie involved.
const fpPromise = FingerprintJS.load();

export async function visitorId() {
  const agent = await fpPromise;
  const result = await agent.get();
  return result.visitorId;
}

export function legacyFingerprint() {
  const client = new ClientJS();
  return client.getFingerprint();
}

export function legacyFingerprintTwo(done) {
  Fingerprint2.get({ excludes: { userAgent: true } }, (components) => done(components));
}
