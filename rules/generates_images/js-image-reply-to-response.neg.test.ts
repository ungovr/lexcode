// lexcode-expect: 0
// Image generation that only the team sees, and lookalikes that call no image model.
import fs from 'node:fs';
import OpenAI from 'openai';
import express from 'express';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

const openai = new OpenAI();
const app = express();

// scripts/make-hero.ts: a designer runs it once and opens the file.
async function main() {
  const result = await openai.images.generate({
    model: 'gpt-image-1',
    prompt: 'Soft watercolor skyline, no text',
    size: '1536x1024',
  });
  const png = Buffer.from(result.data[0].b64_json!, 'base64');
  fs.writeFileSync('./scripts/out/hero-draft.png', png);
  console.log('wrote draft, bytes:', png.length);
}

// A helper with the same name as the AI SDK function, defined locally. It draws an
// Open Graph card with the template engine, no model involved.
function generateImage(title: string) {
  return new ImageResponse(
    { type: 'div', props: { children: title, style: { fontSize: 64 } } } as any,
    { width: 1200, height: 630 },
  );
}

app.get('/og', (req, res) => {
  const card = generateImage(String(req.query.title));
  res.send(card);
});

// Resizing a picture a person uploaded is not generating one.
app.post('/api/thumbnail', async (req, res) => {
  const thumb = await sharp(req.file!.buffer).resize(256, 256).png().toBuffer();
  res.type('png').send(thumb);
});

// A stock-photo search shares the word images with the generation API.
app.get('/api/stock', async (req, res) => {
  const hits = await fetch(`https://stock.example.com/search?q=${encodeURIComponent(String(req.query.q))}`);
  res.json(await hits.json());
});

main();
