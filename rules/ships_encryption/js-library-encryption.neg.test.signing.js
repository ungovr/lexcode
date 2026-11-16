// lexcode-expect: 0
// An app that links a mixed cryptography library only to hash, MAC, sign or make a key pair
// ships no encryption (#13336): none of these is read.
import sodium from 'libsodium-wrappers';
import nacl from 'tweetnacl';
import CryptoJS from 'crypto-js';
import CryptoES from 'crypto-es';
import forge from 'node-forge';
import * as openpgp from 'openpgp';
import kbpgp from 'kbpgp';
import sjcl from 'sjcl';
import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import elliptic from 'elliptic';
import eccrypto from 'eccrypto';

export function digests(text, secret) {
  return [
    CryptoJS.SHA256(text).toString(),
    CryptoJS.HmacSHA256(text, secret).toString(),
    CryptoES.SHA256(text).toString(),
    sjcl.hash.sha256.hash(text),
    sodium.crypto_generichash(32, text),
    nacl.hash(text),
  ];
}

export function signatures(msg, sk, pair) {
  return [
    nacl.sign.detached(msg, sk),
    sodium.crypto_sign_detached(msg, sk),
    secp256k1.sign(msg, sk),
    ed25519.sign(msg, sk),
    new elliptic.ec('secp256k1').keyFromPrivate(sk).sign(msg),
    eccrypto.sign(sk, msg),
    pair.privateKey.sign(forge.md.sha256.create().update(msg)),
  ];
}

// Key pairs made for signing: generating one is not a cipher.
export async function keys() {
  const rsa = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  const pgp = await openpgp.generateKey({ userIDs: [{ name: 'a' }] });
  return { rsa, pgp };
}

// OpenPGP signing, and a kbpgp box that only signs.
export async function pgpSign(text, privateKey) {
  const message = await openpgp.createMessage({ text });
  return openpgp.sign({ message, signingKeys: privateKey });
}

export function boxSignOnly(msg, me, cb) {
  kbpgp.box({ msg, sign_with: me }, cb);
}

// An app's own getSharedSecret and derive are not a library's key agreement.
const store = { getSharedSecret: (id) => id, derive: (x) => x };
export const s = [store.getSharedSecret('a'), store.derive('b')];
