// lexcode-expect: 0
// Speech output and permission checks only, plus a look-alike object of our own.
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export function speak(text: string): void {
  Speech.speak(text, { language: 'en-US', rate: 0.95 });
}

export async function micPermissionGranted(): Promise<boolean> {
  const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
  return result.granted;
}

const Voice = {
  start(): string {
    return 'a local helper named Voice, not the recognition package';
  },
};

export function label(): string {
  return Voice.start();
}

const ticker = {
  startListening(): number {
    return Date.now();
  },
};

export function tick(): number {
  return ticker.startListening();
}
