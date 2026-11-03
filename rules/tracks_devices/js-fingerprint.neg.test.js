// lexcode-expect: 0
import crypto from 'node:crypto';

// A content fingerprint of a file, not of a device or browser.
export function fileFingerprint(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// An app-owned function that happens to use the same words.
export function getFingerprint(record) {
  return `${record.id}:${record.version}`;
}

export const label = getFingerprint({ id: 7, version: 2 });

// Reading the viewport for layout is not fingerprinting.
export function layoutClass() {
  return window.innerWidth < 600 ? 'narrow' : 'wide';
}

export function load(items) {
  return items.map((i) => i.id);
}
export const ids = load([{ id: 1 }]);
