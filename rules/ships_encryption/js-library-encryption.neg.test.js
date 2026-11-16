// lexcode-expect: 0
import crypto from 'node:crypto';
import { createHash } from 'crypto';
import https from 'node:https';

// Hashing, a MAC and a generated key encrypt nothing. (A cipher from Node's crypto module or Web
// Crypto is shipping encryption too; js-platform-encryption reads it.)
export function fingerprint(text) {
  return createHash('sha256').update(text).digest('hex');
}

export function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}

export async function makeKey() {
  return globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

// Stock HTTPS through the platform's client.
export function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

// A method named encrypt on the app's own class is not a library.
class Vault {
  encrypt(value) { return `enc:${value}`; }
}
export const v = new Vault().encrypt('a');
