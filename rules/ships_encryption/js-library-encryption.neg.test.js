// lexcode-expect: 0
import crypto from 'node:crypto';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import https from 'node:https';

// Node's own crypto module is the platform, not a bundled library.
export function encryptWithNode(text, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return { iv, body, tag: cipher.getAuthTag() };
}

export function fingerprint(text) {
  return createHash('sha256').update(text).digest('hex');
}

export function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64');
}

// Web Crypto is the browser's own API.
export async function encryptInBrowser(data, key, iv) {
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
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
