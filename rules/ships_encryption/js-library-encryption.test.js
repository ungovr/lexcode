// lexcode-expect: 10
import AES from "crypto-js/aes";
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import sodium from 'libsodium-wrappers';
import nacl from 'tweetnacl';
import CryptoJS from 'crypto-js';
import forge from 'node-forge';
import * as openpgp from 'openpgp';
import { CompactEncrypt, EncryptJWT } from 'jose';

// Encrypts a note with libsodium before it is stored.
export async function sealNote(note, key) {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const box = sodium.crypto_secretbox_easy(note, nonce, key);
  return { nonce, box };
}

// Public-key encryption between two devices with TweetNaCl.
export function sendToPeer(message, nonce, theirPublic, mySecret) {
  return nacl.box(message, nonce, theirPublic, mySecret);
}

export function sealWithSharedKey(message, nonce, key) {
  return nacl.secretbox(message, nonce, key);
}

// crypto-js AES for a value kept in the browser.
export function lock(text, passphrase) {
  return CryptoJS.AES.encrypt(text, passphrase).toString();
}

// The per-algorithm import of crypto-js, and an AEAD from @noble/ciphers.
export function lockShort(text, passphrase) {
  return AES.encrypt(text, passphrase).toString();
}

export function lockWithNoble(key, nonce, bytes) {
  return xchacha20poly1305(key, nonce).encrypt(bytes);
}

// node-forge builds the cipher itself.
export function forgeEncrypt(key, iv, data) {
  const cipher = forge.cipher.createCipher('AES-GCM', key);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(data));
  cipher.finish();
  return cipher.output;
}

// OpenPGP.js message encryption.
export async function pgpEncrypt(text, publicKeyArmored) {
  const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
  const message = await openpgp.createMessage({ text });
  return openpgp.encrypt({ message, encryptionKeys: publicKey });
}

// JWE encryption with jose.
export async function jwe(payload, key) {
  const direct = await new CompactEncrypt(new TextEncoder().encode(payload))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(key);
  const token = await new EncryptJWT({ sub: 'u1' })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(key);
  return [direct, token];
}
