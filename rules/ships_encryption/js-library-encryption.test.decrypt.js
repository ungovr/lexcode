// lexcode-expect: 14
// An app that only decrypts with a mixed cryptography library still ships encryption (#13336).
import sodium from 'libsodium-wrappers';
import nacl from 'tweetnacl';
import CryptoJS from 'crypto-js';
import * as openpgp from 'openpgp';
import sjcl from 'sjcl';
import eccrypto from 'eccrypto';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';

export function openBoxes(box, nonce, key, theirPublic, mySecret) {
  return [
    sodium.crypto_secretbox_open_easy(box, nonce, key),
    sodium.crypto_box_open_easy(box, nonce, theirPublic, mySecret),
    sodium.crypto_box_seal_open(box, theirPublic, mySecret),
    sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, box, null, nonce, key),
    nacl.secretbox.open(box, nonce, key),
    nacl.box.open(box, nonce, theirPublic, mySecret),
  ];
}

export function unlock(ciphertext, passphrase) {
  return CryptoJS.AES.decrypt(ciphertext, passphrase).toString(CryptoJS.enc.Utf8);
}

export async function pgpDecrypt(message, privateKey) {
  return openpgp.decrypt({ message, decryptionKeys: privateKey });
}

export function sjclDecrypt(password, json) {
  return sjcl.decrypt(password, json);
}

export async function ecies(priv, sealed) {
  return eccrypto.decrypt(priv, sealed);
}

export function nobleOpen(key, nonce, sealed) {
  return xchacha20poly1305(key, nonce).decrypt(sealed);
}

export function streamPull(header, key) {
  return sodium.crypto_secretstream_xchacha20poly1305_init_pull(header, key);
}

export function legacyAead(ct, nonce, key) {
  return [
    sodium.crypto_aead_chacha20poly1305_ietf_decrypt(null, ct, null, nonce, key),
    sodium.crypto_aead_aes256gcm_decrypt(null, ct, null, nonce, key),
  ];
}
