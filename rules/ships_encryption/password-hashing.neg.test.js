// lexcode-expect: 0
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

// A JWT or HMAC signature is not password hashing.
export function issue(user, secret) {
  return jwt.sign({ sub: user.id }, secret, { expiresIn: '1h' });
}

export function webhookSignature(body, secret) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function checksum(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

// The platform's own scrypt is not a bundled hashing library.
export function platformKdf(password, salt) {
  return crypto.scryptSync(password, salt, 64);
}

const hash = (value) => value.split('').reverse().join('');
export const masked = hash('abc');
