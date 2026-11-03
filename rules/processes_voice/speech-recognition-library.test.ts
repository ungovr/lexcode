// lexcode-expect: 3
// Speech recognition through app libraries: Expo's module, react-speech-recognition
// and the React Native voice package. Each start call opens the microphone for text.
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import SpeechRecognition from 'react-speech-recognition';
import Voice from '@react-native-voice/voice';

export async function dictateOnPhone(locale: string): Promise<void> {
  const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) return;
  ExpoSpeechRecognitionModule.start({ lang: locale, interimResults: true });
}

export function dictateInBrowser(): Promise<void> {
  return SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
}

export async function dictateWithVoice(onResult: (text: string) => void): Promise<void> {
  Voice.onSpeechResults = (event) => onResult(event.value?.[0] ?? '');
  await Voice.start('en-US');
}
