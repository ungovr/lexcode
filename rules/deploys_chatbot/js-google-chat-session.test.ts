// lexcode-expect: 3
import { GoogleGenAI } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';

const app = express();
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const legacy = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// A chat session object keeps the turns, so a later message is answered in context.
const sessions = new Map<string, any>();

app.post('/api/chat/:id', async (req, res) => {
  let chat = sessions.get(req.params.id);
  if (!chat) {
    chat = genai.chats.create({ model: 'gemini-2.5-flash' });
    sessions.set(req.params.id, chat);
  }
  const response = await chat.sendMessage({ message: req.body.text });
  res.json({ reply: response.text });
});

// The older SDK's equivalent.
app.post('/api/chat-legacy', async (req, res) => {
  const model = legacy.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const chat = model.startChat({ history: req.body.history ?? [] });
  const result = await chat.sendMessage(req.body.text);
  res.json({ reply: result.response.text() });
});

// Streaming turn.
export async function streamTurn(text: string) {
  const chat = genai.chats.create({ model: 'gemini-2.5-flash' });
  const stream = await chat.sendMessageStream({ message: text });
  let out = '';
  for await (const chunk of stream) out += chunk.text;
  return out;
}
