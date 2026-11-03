// lexcode-expect: 0
// Model calls whose output stays with the team that runs them, and lookalikes that call no model.
import fs from 'node:fs';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import { streamText } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import { prisma } from './db';
import { WebClient } from '@slack/web-api';

const openai = new OpenAI();
const anthropic = new Anthropic();
const slack = new WebClient(process.env.SLACK_TOKEN);
const app = express();

// scripts/weekly-digest.ts: a maintainer runs it and reads stdout.
async function main() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Summarize the open issues for the maintainers.' }],
  });
  console.log(completion.choices[0].message.content);
  fs.writeFileSync('./scripts/out/digest.md', completion.choices[0].message.content ?? '');
}

// A stream the script drains into its own terminal.
async function previewInTerminal(topic: string) {
  const result = streamText({ model: aiOpenai('gpt-4o-mini'), prompt: `Outline a post about ${topic}.` });
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
}

// An internal notice that only the team's own channel receives.
async function notifyTeam(log: string) {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: 'Explain this failure for the on-call engineer:\n' + log }],
  });
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  await slack.chat.postMessage({ channel: '#oncall', text });
  console.error(text);
}

// Routes that call no model.
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/posts', async (req, res) => {
  const posts = await prisma.post.findMany();
  res.json(posts);
});

// A database table that happens to be called messages is not the Anthropic API.
app.post('/api/messages', async (req, res) => {
  const saved = await prisma.messages.create({ data: { body: req.body.body, userId: req.body.userId } });
  res.json({ id: saved.id });
});

// A homegrown helper that only shares a name with the AI SDK function.
function generateText(words: number): string {
  return Array.from({ length: words }, () => 'lorem').join(' ');
}

app.get('/api/placeholder', (req, res) => {
  res.send(generateText(40));
});

main();
