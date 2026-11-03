// lexcode-expect: 5
// Recording the phone's microphone from an Expo or React Native app.
import { Audio } from 'expo-av';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import LiveAudioStream from 'react-native-live-audio-stream';

export async function startLegacyRecording(): Promise<Audio.Recording> {
  await Audio.requestPermissionsAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  return recording;
}

export async function prepareManualRecording(): Promise<Audio.Recording> {
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
  return recording;
}

export function useVoiceMemo() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  return {
    start: async () => {
      await AudioModule.requestRecordingPermissionsAsync();
      await recorder.prepareToRecordAsync();
      recorder.record();
    },
    stop: () => recorder.stop(),
  };
}

const player = new AudioRecorderPlayer();

export async function recordWithPlayerLibrary(): Promise<string> {
  return player.startRecorder();
}

export function streamMicrophone(onChunk: (base64: string) => void): void {
  LiveAudioStream.init({ sampleRate: 16000, channels: 1, bitsPerSample: 16, audioSource: 6, bufferSize: 4096 });
  LiveAudioStream.on('data', onChunk);
  LiveAudioStream.start();
}
