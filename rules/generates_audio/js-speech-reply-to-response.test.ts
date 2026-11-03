// lexcode-expect: 6
import OpenAI from 'openai';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import express from 'express';

const openai = new OpenAI();
const eleven = new ElevenLabsClient();
const gcloud = new TextToSpeechClient();
const polly = new PollyClient({ region: 'us-east-1' });
const app = express();

// Next.js route: the narration the model speaks goes back to the visitor.
export async function POST(request: Request) {
  const { text } = await request.json();
  const speech = await openai.audio.speech.create({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: text });
  return new Response(speech.body, { headers: { 'content-type': 'audio/mpeg' } });
}

// Express route over ElevenLabs.
app.post('/api/narrate', async (req, res) => {
  const audio = await eleven.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
    text: req.body.text,
    modelId: 'eleven_multilingual_v2',
  });
  res.send(audio);
});

// Vercel AI SDK speech generation.
export async function GET(request: Request) {
  const { audio } = await generateSpeech({ model: aiOpenai.speech('tts-1'), text: 'Welcome back.' });
  return new Response(audio.uint8Array, { headers: { 'content-type': 'audio/mpeg' } });
}

// Google Cloud text-to-speech.
app.post('/api/read-aloud', async (req, res) => {
  const [response] = await gcloud.synthesizeSpeech({
    input: { text: req.body.text },
    voice: { languageCode: 'en-US', name: 'en-US-Neural2-C' },
    audioConfig: { audioEncoding: 'MP3' },
  });
  res.end(response.audioContent);
});

// Amazon Polly.
app.post('/api/polly', async (req, res) => {
  const out = await polly.send(
    new SynthesizeSpeechCommand({ Text: req.body.text, OutputFormat: 'mp3', VoiceId: 'Joanna', Engine: 'neural' }),
  );
  out.AudioStream!.pipe(res);
});

// Streaming the speech through the response.
app.get('/api/stream', async (req, res) => {
  const stream = await eleven.textToSpeech.stream('JBFqnCBsd6RMkjVDRZzb', { text: String(req.query.text) });
  res.status(200).send(stream);
});
