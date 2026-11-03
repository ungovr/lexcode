// lexcode-expect: 4
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import RunwayML from '@runwayml/sdk';
import express from 'express';
import { NextResponse } from 'next/server';

const openai = new OpenAI();
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const runway = new RunwayML();
const app = express();

// Next.js route: the clip the model renders is handed to the visitor.
export async function POST(request: Request) {
  const { prompt } = await request.json();
  const job = await openai.videos.createAndPoll({ model: 'sora-2', prompt, seconds: '4' });
  return NextResponse.json({ id: job.id, status: job.status });
}

// Express route that starts a Sora job and returns it.
app.post('/api/clip', async (req, res) => {
  const job = await openai.videos.create({ model: 'sora-2', prompt: req.body.prompt });
  res.status(202).json({ jobId: job.id });
});

// Veo through Google GenAI.
app.post('/api/veo', async (req, res) => {
  const operation = await genai.models.generateVideos({
    model: 'veo-3.0-generate-001',
    prompt: req.body.prompt,
  });
  res.json({ operation: operation.name });
});

// Image-to-video at Runway.
app.post('/api/animate', async (req, res) => {
  const task = await runway.imageToVideo.create({
    model: 'gen4_turbo',
    promptImage: req.body.imageUrl,
    promptText: req.body.prompt,
    ratio: '1280:720',
  });
  res.send({ taskId: task.id });
});
