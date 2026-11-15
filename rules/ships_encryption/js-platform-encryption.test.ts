// lexcode-expect: 22
import crypto from 'node:crypto';
import * as nodeCrypto from 'crypto';
import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, createECDH, diffieHellman } from 'crypto';
import { createCipheriv as makeCipher } from 'node:crypto';
const { createDiffieHellman } = require('crypto');

// Node's crypto module, called on the module object.
export function sealRecord(text: string, key: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); // 1
  const body = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return { iv, body, tag: cipher.getAuthTag() };
}

export function openRecord(body: Buffer, key: Buffer, iv: Buffer, tag: Buffer) {
  const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, iv); // 2
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
}

// The same calls under their imported names, one of them renamed.
export function sealImported(text: string, key: Buffer, iv: Buffer) {
  const cipher = createCipheriv('chacha20-poly1305', key, iv, { authTagLength: 16 }); // 3
  return cipher.update(text, 'utf8');
}

export function openImported(body: Buffer, key: Buffer, iv: Buffer) {
  return createDecipheriv('aes-256-cbc', key, iv).update(body); // 4
}

export function sealRenamed(text: string, key: Buffer, iv: Buffer) {
  return makeCipher('aes-256-ctr', key, iv).update(text); // 5
}

// RSA-OAEP encryption of a data key.
export function wrapDataKey(dataKey: Buffer, publicPem: string) {
  return crypto.publicEncrypt({ key: publicPem, oaepHash: 'sha256' }, dataKey); // 6
}

export function unwrapDataKey(wrapped: Buffer, privatePem: string) {
  return privateDecrypt(privatePem, wrapped); // 7
}

export function wrapImported(dataKey: Buffer, publicPem: string) {
  return publicEncrypt(publicPem, dataKey); // 8
}

// Key agreement: ECDH, X25519 through diffieHellman, and classic Diffie-Hellman.
export function agree(peerPublic: Buffer) {
  const ecdh = crypto.createECDH('prime256v1'); // 9
  ecdh.generateKeys();
  return ecdh.computeSecret(peerPublic);
}

export function agreeImported() {
  return createECDH('secp384r1'); // 10
}

export function agreeX25519(privateKey: crypto.KeyObject, publicKey: crypto.KeyObject) {
  return crypto.diffieHellman({ privateKey, publicKey }); // 11
}

export function agreeX25519Imported(privateKey: crypto.KeyObject, publicKey: crypto.KeyObject) {
  return diffieHellman({ privateKey, publicKey }); // 12
}

export function classicDh() {
  return createDiffieHellman(2048); // 13
}

// Web Crypto, from the global crypto, window.crypto and globalThis.crypto.
export async function encryptInBrowser(data: ArrayBuffer, key: CryptoKey, iv: Uint8Array) {
  return crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data); // 14
}

export async function decryptInBrowser(data: ArrayBuffer, key: CryptoKey, iv: Uint8Array) {
  return window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data); // 15
}

export async function wrapForPeer(key: CryptoKey, wrappingKey: CryptoKey) {
  return globalThis.crypto.subtle.wrapKey('raw', key, wrappingKey, { name: 'RSA-OAEP' }); // 16
}

export async function unwrapFromPeer(wrapped: ArrayBuffer, unwrappingKey: CryptoKey) {
  return crypto.subtle.unwrapKey('raw', wrapped, unwrappingKey, { name: 'RSA-OAEP' }, { name: 'AES-GCM' }, false, ['decrypt']); // 17
}

// A destructured subtle, as service workers often hold it.
const { subtle } = globalThis.crypto;
export async function encryptWithSubtle(data: ArrayBuffer, key: CryptoKey, iv: Uint8Array) {
  return subtle.encrypt({ name: 'AES-GCM', iv }, key, data); // 18
}

// Key agreement through Web Crypto: ECDH and X25519.
export async function sharedKey(privateKey: CryptoKey, peer: CryptoKey) {
  return crypto.subtle.deriveKey( // 19
    { name: 'ECDH', public: peer },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function sharedBits(privateKey: CryptoKey, peer: CryptoKey) {
  return window.crypto.subtle.deriveBits({ name: 'X25519', public: peer }, privateKey, 256); // 20
}

export async function sharedBitsSubtle(privateKey: CryptoKey, peer: CryptoKey) {
  return subtle.deriveBits({ name: "ecdh", public: peer }, privateKey, 256); // 21
}

// A chain split on its dots.
export function sealSplit(text: string, key: Buffer, iv: Buffer) {
  return crypto
    .createCipheriv('aes-256-gcm', key, iv) // 22
    .update(text);
}
