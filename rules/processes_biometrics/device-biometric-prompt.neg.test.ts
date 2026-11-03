// lexcode-expect: 0
// Checking that biometric hardware exists, passcode sign-in, and a WebAuthn
// passkey, which is a device-held key and not a biometric template.
import * as LocalAuthentication from 'expo-local-authentication';

export async function canOfferBiometrics(): Promise<boolean> {
  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hardware && enrolled;
}

export async function signIn(email: string, password: string): Promise<Response> {
  return fetch('/api/session', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function loginWithPasskey(challenge: Uint8Array): Promise<Credential | null> {
  return navigator.credentials.get({
    publicKey: { challenge, userVerification: 'preferred', timeout: 60000 },
  });
}
