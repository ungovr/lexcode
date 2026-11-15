// lexcode-expect: 0
import crypto from 'node:crypto';
import { createHash, createHmac, createSign, randomBytes, scryptSync, pbkdf2Sync, sign } from 'crypto';
import https from 'node:https';
import bcrypt from 'bcrypt';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

// Hashing is not encryption.
export function fingerprint(text: string) {
  return createHash('sha256').update(text).digest('hex');
}

export async function digestInBrowser(data: ArrayBuffer) {
  return crypto.subtle.digest('SHA-256', data);
}

// A message authentication code is integrity, not confidentiality.
export function webhookSignature(body: string, secret: string) {
  return createHmac('sha256', secret).update(body).digest('base64');
}

export async function macInBrowser(key: CryptoKey, data: ArrayBuffer) {
  return crypto.subtle.sign('HMAC', key, data);
}

// Password hashing and key derivation, from the platform and from bundled libraries.
export function platformKdf(password: string, salt: Buffer) {
  return [scryptSync(password, salt, 64), pbkdf2Sync(password, salt, 600000, 32, 'sha256')];
}

export async function hashPassword(password: string) {
  return [await bcrypt.hash(password, 12), await argon2.hash(password)];
}

export async function keyFromPassword(material: CryptoKey, salt: Uint8Array) {
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    material,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

export async function bitsFromSecret(material: CryptoKey, salt: Uint8Array) {
  return crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: new Uint8Array() }, material, 256);
}

// Signing, with the platform and with a JWT library.
export function signReceipt(body: string, privatePem: string) {
  return [createSign('SHA256').update(body).sign(privatePem), sign(null, Buffer.from(body), privatePem)];
}

export function rsaSignaturePrimitive(digest: Buffer, privatePem: string) {
  return crypto.privateEncrypt(privatePem, digest);
}

export async function signInBrowser(key: CryptoKey, data: ArrayBuffer) {
  return window.crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data);
}

export function issue(userId: string, secret: string) {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '1h' });
}

// Random bytes and a key that is only generated.
export function token() {
  return [randomBytes(32).toString('hex'), crypto.randomUUID(), globalThis.crypto.getRandomValues(new Uint8Array(16))];
}

export async function makeKey() {
  return globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

// Stock HTTPS through the platform's clients.
export async function getJson(url: string) {
  const res = await fetch('https://api.example.org/v1/items');
  https.get(url, (r) => r.resume());
  return res.json();
}

// The app's own functions and methods of the same names, not imported from the crypto module.
function diffieHellman(a: number, b: number) {
  return a * b;
}
export const product = diffieHellman(2, 3);

class Vault {
  encrypt(value: string) {
    return `enc:${value}`;
  }
}
export const v = new Vault().encrypt('a');
