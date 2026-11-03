// lexcode-expect: 2
import * as tf from '@tensorflow/tfjs-node';

// Train a small classifier on the rows the app has collected.
export async function trainModel(features: number[][], labels: number[]) {
  const xs = tf.tensor2d(features);
  const ys = tf.tensor1d(labels);
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [features[0].length] }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: tf.train.adam(0.01), loss: 'binaryCrossentropy' });
  await model.fit(xs, ys, { epochs: 30, batchSize: 32 });
  await model.save('file://./model');
  return model;
}

// A functional model built from layers.
export async function trainFunctional(xs: tf.Tensor, ys: tf.Tensor) {
  const input = tf.input({ shape: [8] });
  const out = tf.layers.dense({ units: 1 }).apply(input) as tf.SymbolicTensor;
  const net = tf.model({ inputs: input, outputs: out });
  net.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
  return net.fit(xs, ys, { epochs: 10 });
}
