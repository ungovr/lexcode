// lexcode-expect: 3
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import Together from 'together-ai';
import express from 'express';

const openai = new OpenAI();
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const together = new Together();
const app = express();

// Hosted fine-tuning of a vendor model on data the app collected.
export async function startFineTune(trainingFileId: string) {
  const job = await openai.fineTuning.jobs.create({
    training_file: trainingFileId,
    model: 'gpt-4o-mini-2024-07-18',
  });
  return job.id;
}

app.post('/admin/tune', async (req, res) => {
  const job = await genai.tunings.tune({
    baseModel: 'gemini-2.5-flash',
    trainingDataset: req.body.dataset,
    config: { epochCount: 3, tunedModelDisplayName: 'support-tuned' },
  });
  res.json({ name: job.name });
});

export async function tuneOpenModel(fileId: string) {
  return together.fineTuning.create({
    training_file: fileId,
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Reference',
  });
}
