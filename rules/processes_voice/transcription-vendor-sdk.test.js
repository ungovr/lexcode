// lexcode-expect: 4
// Deepgram and AssemblyAI clients: each call sends speech to the vendor for transcription.
import { createClient } from '@deepgram/sdk';
import { AssemblyAI } from 'assemblyai';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const assembly = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

export async function transcribeUpload(buffer) {
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(buffer, {
    model: 'nova-2',
    smart_format: true,
  });
  if (error) throw error;
  return result.results.channels[0].alternatives[0].transcript;
}

export async function transcribeLink(url) {
  const { result } = await deepgram.listen.prerecorded.transcribeUrl({ url }, { model: 'nova-2' });
  return result;
}

export function openLiveSocket(onText) {
  const connection = deepgram.listen.live({ model: 'nova-2', interim_results: true });
  connection.on('Results', (data) => onText(data.channel.alternatives[0].transcript));
  return connection;
}

export async function transcribeWithAssembly(audioUrl) {
  const transcript = await assembly.transcripts.transcribe({ audio: audioUrl, speaker_labels: true });
  return transcript.text;
}
