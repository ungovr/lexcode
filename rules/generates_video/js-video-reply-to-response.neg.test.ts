// lexcode-expect: 0
// Video generation that only the team sees, and lookalikes that generate nothing.
import fs from 'node:fs';
import OpenAI from 'openai';
import express from 'express';
import { prisma } from './db';
import ffmpeg from 'fluent-ffmpeg';

const openai = new OpenAI();
const app = express();

// scripts/render-teaser.ts: a producer runs it by hand and opens the file.
async function main() {
  const job = await openai.videos.createAndPoll({ model: 'sora-2', prompt: 'Slow pan across a harbor at dawn' });
  console.log('job', job.id, job.status);
  const content = await openai.videos.downloadContent(job.id);
  fs.writeFileSync('./scripts/out/teaser.mp4', Buffer.from(await content.arrayBuffer()));
}

// A video table with a create method is not the generation API.
app.post('/api/videos', async (req, res) => {
  const row = await prisma.videos.create({ data: { title: req.body.title, url: req.body.url, ownerId: req.body.ownerId } });
  res.json({ id: row.id });
});

// Trimming footage a person shot is not generating video.
app.post('/api/trim', (req, res) => {
  ffmpeg(req.body.path)
    .setStartTime('00:00:03')
    .duration(10)
    .output('/tmp/trimmed.mp4')
    .on('end', () => res.json({ ok: true }))
    .run();
});

main();
