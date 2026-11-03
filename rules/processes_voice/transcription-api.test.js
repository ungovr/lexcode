// lexcode-expect: 5
// Speech-to-text calls: recorded audio goes to a transcription endpoint or an
// in-process speech model, and text comes back.
import fs from 'node:fs';
import OpenAI from 'openai';
import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { experimental_transcribe as transcribe } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import { pipeline } from '@huggingface/transformers';

const openai = new OpenAI();
const aws = new TranscribeClient({ region: 'us-east-1' });

export async function transcribeFile(path) {
  const result = await openai.audio.transcriptions.create({
    file: fs.createReadStream(path),
    model: 'whisper-1',
  });
  return result.text;
}

export async function translateToEnglish(path) {
  return openai.audio.translations.create({ file: fs.createReadStream(path), model: 'whisper-1' });
}

export async function startJob(bucketKey, jobName) {
  return aws.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: 'en-US',
      Media: { MediaFileUri: `s3://recordings/${bucketKey}` },
    }),
  );
}

export async function viaAiSdk(audio) {
  const { text } = await transcribe({ model: aiOpenai.transcription('whisper-1'), audio });
  return text;
}

export async function inBrowser(audioUrl) {
  const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
  return asr(audioUrl);
}
