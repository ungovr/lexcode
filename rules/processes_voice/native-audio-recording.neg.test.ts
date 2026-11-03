// lexcode-expect: 0
// Playing sounds and asking about permissions. Nothing records a person.
import { Audio } from 'expo-av';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Vibration } from 'react-native';

export async function playChime(): Promise<void> {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  const { sound } = await Audio.Sound.createAsync(require('../assets/chime.mp3'));
  await sound.playAsync();
}

export async function playConfirmation(uri: string): Promise<void> {
  await setAudioModeAsync({ playsInSilentMode: true });
  const player = createAudioPlayer({ uri });
  player.play();
}

export async function hasMicrophonePermission(): Promise<boolean> {
  const status = await Audio.getPermissionsAsync();
  return status.granted;
}

export function buzz(): void {
  Vibration.vibrate(120);
}

class Recording {
  constructor(public readonly label: string) {}
}

export function newEntry(label: string): Recording {
  // A log entry type that shares a name with the recording class.
  return new Recording(label);
}
