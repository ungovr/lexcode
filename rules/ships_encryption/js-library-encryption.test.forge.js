// lexcode-expect: 4
// node-forge RSA with the default scheme (RSAES-PKCS1-V1_5) or a scheme held in a variable, in a file
// that imports node-forge (#13336).
const forge = require('node-forge');

export function sealFor(pem, bytes) {
  const publicKey = forge.pki.publicKeyFromPem(pem);
  return publicKey.encrypt(bytes);
}

export function sealWith(key, bytes, scheme) {
  return key.encrypt(bytes, scheme);
}

export function open(pem, sealed) {
  const privateKey = forge.pki.privateKeyFromPem(pem);
  return privateKey.decrypt(sealed);
}

export function generatedThenSealed(bytes) {
  const pair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  return pair.publicKey.encrypt(bytes);
}
