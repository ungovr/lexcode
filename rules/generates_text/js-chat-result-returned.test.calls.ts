// lexcode-expect: 21
// One function per call this rule's sinks list (#13034), in each form that reaches it: returned
// from a named function and from an anonymous callback, and set at module level and returned by a
// function. A sink entry that stops matching drops a match here.
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { generateObject, generateText, streamObject, streamText } from "ai";
import { z } from 'zod';

const openai = new OpenAI();
const anthropic = new Anthropic();
const schema = z.object({ title: z.string() });
const Q = 'Write a haiku about the sea.';

export async function n1(q: string) {
  return openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: q }] });
}
export const c1 = retry(async function (q: string) {
  return openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: q }] });
});
const m1Result = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: Q }] });
export function m1() {
  return m1Result;
}

export async function n2(q: string) {
  return openai.responses.create({ model: 'gpt-4.1', input: q });
}
export const c2 = retry(async function (q: string) {
  return openai.responses.create({ model: 'gpt-4.1', input: q });
});
const m2Result = await openai.responses.create({ model: 'gpt-4.1', input: Q });
export function m2() {
  return m2Result;
}

export async function n3(q: string) {
  return anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 300, messages: [{ role: 'user', content: q }] });
}
export const c3 = retry(async function (q: string) {
  return anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 300, messages: [{ role: 'user', content: q }] });
});
const m3Result = await anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 300, messages: [{ role: 'user', content: Q }] });
export function m3() {
  return m3Result;
}

export async function n4(q: string) {
  return generateText({ model: 'openai/gpt-4o-mini', prompt: q });
}
export const c4 = retry(async function (q: string) {
  return generateText({ model: 'openai/gpt-4o-mini', prompt: q });
});
const m4Result = await generateText({ model: 'openai/gpt-4o-mini', prompt: Q });
export function m4() {
  return m4Result;
}

export async function n5(q: string) {
  return streamText({ model: 'openai/gpt-4o-mini', prompt: q });
}
export const c5 = retry(async function (q: string) {
  return streamText({ model: 'openai/gpt-4o-mini', prompt: q });
});
const m5Result = await streamText({ model: 'openai/gpt-4o-mini', prompt: Q });
export function m5() {
  return m5Result;
}

export async function n6(q: string) {
  return generateObject({ model: 'openai/gpt-4o-mini', schema, prompt: q });
}
export const c6 = retry(async function (q: string) {
  return generateObject({ model: 'openai/gpt-4o-mini', schema, prompt: q });
});
const m6Result = await generateObject({ model: 'openai/gpt-4o-mini', schema, prompt: Q });
export function m6() {
  return m6Result;
}

export async function n7(q: string) {
  return streamObject({ model: 'openai/gpt-4o-mini', schema, prompt: q });
}
export const c7 = retry(async function (q: string) {
  return streamObject({ model: 'openai/gpt-4o-mini', schema, prompt: q });
});
const m7Result = await streamObject({ model: 'openai/gpt-4o-mini', schema, prompt: Q });
export function m7() {
  return m7Result;
}
