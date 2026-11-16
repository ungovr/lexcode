// lexcode-expect: 13
// The libraries that mix hashing, MACs or signing with their ciphers have no component-map entry;
// these are their cipher and key-agreement calls, which this rule reads instead (#13336).
import sodium from 'libsodium-wrappers';
import nacl from 'tweetnacl';
import CryptoES from 'crypto-es';
import forge from 'node-forge';
import kbpgp from 'kbpgp';
import sjcl from 'sjcl';
import { secp256k1 } from '@noble/curves/secp256k1';
import { x25519 } from '@noble/curves/ed25519';
import elliptic from 'elliptic';
import eccrypto from 'eccrypto';

// libsodium key exchange and scalar multiplication.
export function sessionKeys(clientPk, clientSk, serverPk) {
  return sodium.crypto_kx_client_session_keys(clientPk, clientSk, serverPk);
}

export function shared(sk, pk) {
  return sodium.crypto_scalarmult(sk, pk);
}

// TweetNaCl's raw key agreement.
export function naclShared(sk, pk) {
  return nacl.scalarMult(sk, pk);
}

// crypto-es, the ES-module fork of crypto-js.
export function lockEs(text, passphrase) {
  return CryptoES.AES.encrypt(text, passphrase).toString();
}

// node-forge RSA-OAEP and PKCS#7 enveloped data.
export function rsaOaep(publicKey, bytes) {
  return publicKey.encrypt(bytes, 'RSA-OAEP', { md: forge.md.sha256.create() });
}

export function envelope(cert, text) {
  const p7 = forge.pkcs7.createEnvelopedData();
  p7.addRecipient(cert);
  p7.content = forge.util.createBuffer(text);
  p7.encrypt();
  return p7;
}

// A kbpgp box that names a recipient encrypts.
export function boxFor(msg, alice, cb) {
  kbpgp.box({ msg, encrypt_for: alice }, cb);
}

// SJCL's AES block cipher object.
export function sjclBlock(key, block) {
  return new sjcl.cipher.aes(key).encrypt(block);
}

// ECDH with @noble/curves on two curves.
export function nobleShared(priv, pub) {
  return [secp256k1.getSharedSecret(priv, pub), x25519.getSharedSecret(priv, pub)];
}

// ECDH with elliptic.
const ec = new elliptic.ec('secp256k1');
export function ellipticShared(mine, theirs) {
  const peer = ec.keyFromPublic(theirs, 'hex');
  return mine.derive(peer.getPublic());
}

// eccrypto's ECIES encryption and its ECDH.
export async function ecies(pub, msg, priv) {
  const sealed = await eccrypto.encrypt(pub, Buffer.from(msg));
  const secret = await eccrypto.derive(priv, pub);
  return { sealed, secret };
}
