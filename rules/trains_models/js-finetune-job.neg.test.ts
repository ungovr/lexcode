// lexcode-expect: 0
// Calling models somebody else trained, and look-alike method names that train nothing.
import * as tf from '@tensorflow/tfjs-node';
import OpenAI from 'openai';
import { NeuralNetwork } from 'brain.js';
import Fuse from 'fuse.js';

const openai = new OpenAI();

// A pre-trained model loaded from disk is only asked for predictions.
export async function classifyImage(pixels: number[]) {
  const model = await tf.loadLayersModel('file://./models/mobilenet/model.json');
  const out = model.predict(tf.tensor4d(pixels, [1, 224, 224, 3])) as tf.Tensor;
  return Array.from(await out.data());
}

// A network restored from JSON and run, never trained here.
export function recommend(saved: object, input: number[]) {
  const net = new NeuralNetwork();
  net.fromJSON(saved as any);
  return net.run(input);
}

// Calling somebody else's hosted model is not training one.
export async function ask(prompt: string) {
  const reply = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });
  return reply.choices[0].message.content;
}

// Fitting a viewport and training a dog are not machine learning.
export function fitToScreen(map: { fit: (b: number[]) => void }, bounds: number[]) {
  map.fit(bounds);
}

export class DogTrainer {
  train(command: string) {
    return `sit ${command}`;
  }
}

export function search(items: string[], q: string) {
  return new Fuse(items).search(q);
}

new DogTrainer().train('stay');
