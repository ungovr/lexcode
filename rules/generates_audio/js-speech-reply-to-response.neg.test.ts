// lexcode-expect: 0
// Speech synthesis that only the team hears, and audio handling that synthesizes nothing.
import fs from 'node:fs';
import OpenAI from 'openai';
import express from 'express';
import { createReadStream } from 'node:fs';

const openai = new OpenAI();
const app = express();

// scripts/make-voicemail-greeting.ts: an operator runs it and plays the file.
async function main() {
  const speech = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'alloy',
    input: 'You have reached the front desk. Please leave a message.',
  });
  fs.writeFileSync('./scripts/out/greeting.mp3', Buffer.from(await speech.arrayBuffer()));
  console.log('greeting written');
}

// A person's own recording that the app only plays is not generated audio.
app.get('/api/recordings/:id', (req, res) => {
  res.type('audio/mpeg');
  createReadStream(`./recordings/${req.params.id}.mp3`).pipe(res);
});

// A helper that shares a name with the AI SDK function and builds a tone with math.
function generateSpeech(frequency: number, seconds: number): Float32Array {
  const samples = new Float32Array(Math.floor(44100 * seconds));
  for (let i = 0; i < samples.length; i++) samples[i] = Math.sin((2 * Math.PI * frequency * i) / 44100);
  return samples;
}

app.get('/api/beep', (req, res) => {
  res.send(Buffer.from(generateSpeech(440, 0.2).buffer));
});

// Transcribing a person's recording turns speech into text; it makes no audio.
app.post('/api/transcribe', async (req, res) => {
  const transcript = await openai.audio.transcriptions.create({
    model: 'gpt-4o-transcribe',
    file: createReadStream(req.body.path),
  });
  res.json({ text: transcript.text });
});

main();
