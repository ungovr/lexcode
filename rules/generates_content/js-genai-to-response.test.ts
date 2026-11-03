// lexcode-expect: 4
import { GoogleGenAI } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import express from 'express';

const app = express();
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const legacy = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Next.js route: whatever the model returns, text or an image, goes back to the visitor.
export async function POST(request: Request) {
  const { prompt } = await request.json();
  const response = await genai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  return NextResponse.json({ text: response.text });
}

// The older SDK, through a model handle.
app.post('/api/answer', async (req, res) => {
  const model = legacy.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(req.body.question);
  res.json({ answer: result.response.text() });
});

// Streaming.
app.get('/api/story', async (req, res) => {
  const stream = await genai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: `Tell a story about ${req.query.topic}`,
  });
  for await (const chunk of stream) {
    res.write(chunk.text);
  }
  res.end();
});

// A multimodal request, with the answer returned as a Web Response.
export async function PUT(request: Request) {
  const { imageBase64 } = await request.json();
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ inlineData: { mimeType: 'image/png', data: imageBase64 } }, { text: 'Describe this picture.' }],
  });
  return new Response(response.text);
}
