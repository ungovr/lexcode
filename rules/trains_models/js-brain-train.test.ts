// lexcode-expect: 3
import brain from 'brain.js';
import { NeuralNetwork, recurrent } from 'brain.js';

// brain.js learns from labelled examples.
export function trainRecommender(examples: { input: number[]; output: number[] }[]) {
  const net = new brain.NeuralNetwork({ hiddenLayers: [8] });
  net.train(examples, { iterations: 2000, errorThresh: 0.005 });
  return net.toJSON();
}

export function trainNamedImport(examples: any[]) {
  const net = new NeuralNetwork();
  net.train(examples);
  return net;
}

export function trainTextModel(lines: string[]) {
  const lstm = new recurrent.LSTM();
  lstm.train(lines, { iterations: 1500, log: false });
  return lstm;
}
