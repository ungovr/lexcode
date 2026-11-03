// lexcode-expect: 6
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { experimental_generateImage as generateImage } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';
import express from 'express';
import { put } from '@vercel/blob';

const openai = new OpenAI();
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();

// Next.js route: the picture the model draws is returned to the visitor.
export async function POST(request: Request) {
  const { prompt } = await request.json();
  const result = await openai.images.generate({ model: 'gpt-image-1', prompt, size: '1024x1024' });
  const b64 = result.data[0].b64_json;
  return NextResponse.json({ image: `data:image/png;base64,${b64}` });
}

// Express route that stores the image and hands back its URL.
app.post('/api/avatar', async (req, res) => {
  const result = await openai.images.generate({ model: 'dall-e-3', prompt: `Avatar of ${req.body.name}` });
  const blob = await put(`avatars/${req.body.id}.png`, Buffer.from(result.data[0].b64_json!, 'base64'), {
    access: 'public',
  });
  res.json({ url: blob.url });
});

// The edit endpoint of the same API.
app.post('/api/retouch', async (req, res) => {
  const edited = await openai.images.edit({ model: 'gpt-image-1', image: req.file as any, prompt: req.body.prompt });
  res.status(200).send(edited.data[0].b64_json);
});

// Vercel AI SDK image generation.
export async function GET(request: Request) {
  const { image } = await generateImage({ model: aiOpenai.image('dall-e-3'), prompt: 'A lighthouse at dusk' });
  return new Response(image.uint8Array, { headers: { 'content-type': 'image/png' } });
}

// Google GenAI Imagen.
app.get('/api/poster', async (req, res) => {
  const response = await genai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: String(req.query.theme),
    config: { numberOfImages: 1 },
  });
  const bytes = response.generatedImages![0].image!.imageBytes;
  res.send(bytes);
});

// Variation endpoint.
app.post('/api/variation', async (req, res) => {
  const v = await openai.images.createVariation({ image: req.file as any, n: 1 });
  res.json({ url: v.data[0].url });
});
