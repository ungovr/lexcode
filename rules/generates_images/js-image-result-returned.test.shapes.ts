// lexcode-expect: 2
// Shapes the narrower sink has to keep (#13034): an anonymous callback and an image made at module
// level that a function returns.
import OpenAI from 'openai';

const openai = new OpenAI();

const hero = await openai.images.generate({ model: 'gpt-image-1', prompt: 'A lighthouse at dawn' });

export function heroImage() {
  return hero.data?.[0]?.b64_json;
}

export const stickers = (subjects: string[]) =>
  subjects.map(async function (subject) {
    const img = await openai.images.generate({ model: 'gpt-image-1', prompt: `A sticker of ${subject}` });
    return img.data?.[0]?.b64_json;
  });
