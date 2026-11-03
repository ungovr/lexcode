// lexcode-expect: 0
// WebAuthn passkeys and the Credential Management API for passwords are not digital identity credentials.
export async function passkeySignIn(publicKey) {
  const credential = await navigator.credentials.get({ publicKey });
  return credential;
}

export async function storedPassword() {
  return navigator.credentials.get({ password: true, mediation: 'optional' });
}

export async function federatedSignIn() {
  return navigator.credentials.get({ federated: { providers: ['https://accounts.google.com'] } });
}

export async function savePassword(form) {
  const cred = new PasswordCredential(form);
  return navigator.credentials.store(cred);
}

const digital = { label: 'a local variable named digital' };
export const config = { digital, credentials: { get: () => digital } };
export const picked = config.credentials.get({ digital });
