// lexcode-expect: 5
// Shapes the narrower sink has to keep (#13034): an anonymous callback, an arrow callback, a class
// method, and a result made at module level that a function returns.
import OpenAI from 'openai';
import { generateText } from 'ai';

const openai = new OpenAI();

const greeting = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Write a one-line greeting for the home page.' }],
});

export function homeGreeting() {
  return greeting.choices[0].message.content;
}

export const homeGreeting2 = () => greeting.choices[0].message.content;

export const withRetry = retry(async function () {
  const r = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [] });
  return r.choices[0].message.content;
});

export function titles(topics: string[]) {
  return topics.map(async (topic) => {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `A title for ${topic}` }],
    });
    return r.choices[0].message.content;
  });
}

export class Writer {
  async intro(name: string) {
    const out = await generateText({ model: 'openai/gpt-4.1', prompt: `Introduce ${name}.` });
    return out.text;
  }
}
