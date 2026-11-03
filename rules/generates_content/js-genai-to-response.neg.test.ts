// lexcode-expect: 0
// Model calls whose output stays with the team that runs them, and lookalikes that call no model.
import fs from 'node:fs';
import { ChatOpenAI } from '@langchain/openai';
import { GoogleGenAI } from '@google/genai';
import express from 'express';
import { prisma } from './db';

const app = express();
const model = new ChatOpenAI({ model: 'gpt-4o-mini' });
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// scripts/triage.ts: an engineer runs it and reads the terminal.
async function main() {
  const out = await model.invoke('Group these support tickets by theme for the team meeting.');
  console.log(out.content);
  const res = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'List the three biggest risks in this roadmap.',
  });
  fs.writeFileSync('./scripts/out/risks.md', res.text ?? '');
  console.error(res.text);
}

// A route that calls no model, and a promise-style invoke that is not LangChain.
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const jobs = {
  invoke: async (name: string) => ({ name, ran: true }),
};

app.post('/api/jobs/:name', async (req, res) => {
  const result = await jobs.invoke(req.params.name);
  res.json(result);
});

// Content a person wrote, which the app only reads back, is not generated content.
app.get('/api/pages/:id', async (req, res) => {
  const page = await prisma.page.findUnique({ where: { id: req.params.id } });
  res.json(page);
});

main();
