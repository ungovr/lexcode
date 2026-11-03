// lexcode-expect: 0
// Speech synthesis, text models and unrelated "transcription" words. No human
// voice is read here: text goes in, or audio goes out.
import fs from 'node:fs';
import OpenAI from 'openai';
import { pipeline } from '@huggingface/transformers';

const openai = new OpenAI();

export async function speak(text) {
  const audio = await openai.audio.speech.create({ model: 'tts-1', voice: 'alloy', input: text });
  return Buffer.from(await audio.arrayBuffer());
}

export async function summarize(text) {
  const reply = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `Summarize: ${text}` }],
  });
  return reply.choices[0].message.content;
}

export async function classify(text) {
  const classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased');
  return classifier(text);
}

export function saveTranscriptionNotes(path, notes) {
  // The words are about transcripts; the code only writes a text file.
  fs.writeFileSync(path, notes.join('\n'));
  const transcriptions = { create: (x) => x };
  return transcriptions.create(path);
}
