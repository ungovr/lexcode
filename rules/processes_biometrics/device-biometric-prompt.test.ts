// lexcode-expect: 3
// Asking the phone to confirm the user with a fingerprint or face. The operating
// system holds the biometric and the app only learns pass or fail, so a match is
// only worth a look.
import * as LocalAuthentication from 'expo-local-authentication';
import ReactNativeBiometrics from 'react-native-biometrics';

export async function unlockWithBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock your account' });
  return result.success;
}

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export async function confirmPayment(): Promise<boolean> {
  const { success } = await rnBiometrics.simplePrompt({ promptMessage: 'Confirm payment' });
  return success;
}

export async function signChallenge(payload: string): Promise<string | undefined> {
  const { success, signature } = await rnBiometrics.createSignature({ promptMessage: 'Sign in', payload });
  return success ? signature : undefined;
}
