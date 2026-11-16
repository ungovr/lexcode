// lexcode-expect: 12
// One function per call this rule's sinks list (#13034), in each form that reaches it: returned
// from a named function and from an anonymous callback, and set at module level and returned by a
// function. A sink entry that stops matching drops a match here.
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { experimental_generateImage, generateImage } from "ai";

const openai = new OpenAI();
const genai = new GoogleGenAI({});
const Q = 'A lighthouse at dawn';

export async function n1(q: string) {
  return openai.images.generate({ model: 'gpt-image-1', prompt: q });
}
export const c1 = retry(async function (q: string) {
  return openai.images.generate({ model: 'gpt-image-1', prompt: q });
});
const m1Result = await openai.images.generate({ model: 'gpt-image-1', prompt: Q });
export function m1() {
  return m1Result;
}

export async function n2(q: string) {
  return genai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: q });
}
export const c2 = retry(async function (q: string) {
  return genai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: q });
});
const m2Result = await genai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: Q });
export function m2() {
  return m2Result;
}

export async function n3(q: string) {
  return experimental_generateImage({ model: 'openai/gpt-image-1', prompt: q });
}
export const c3 = retry(async function (q: string) {
  return experimental_generateImage({ model: 'openai/gpt-image-1', prompt: q });
});
const m3Result = await experimental_generateImage({ model: 'openai/gpt-image-1', prompt: Q });
export function m3() {
  return m3Result;
}

export async function n4(q: string) {
  return generateImage({ model: 'openai/gpt-image-1', prompt: q });
}
export const c4 = retry(async function (q: string) {
  return generateImage({ model: 'openai/gpt-image-1', prompt: q });
});
const m4Result = await generateImage({ model: 'openai/gpt-image-1', prompt: Q });
export function m4() {
  return m4Result;
}
