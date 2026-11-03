// lexcode-expect: 0
// Text-to-speech and unrelated start() calls. Nothing here listens to a person.
export function readAloud(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  window.speechSynthesis.speak(utterance);
}

export class Stopwatch {
  constructor() {
    this.startedAt = 0;
  }

  start() {
    this.startedAt = Date.now();
  }
}

export function begin() {
  const watch = new Stopwatch();
  watch.start();
  const worker = new Worker('/job.js');
  worker.postMessage({ cmd: 'start' });
  return watch;
}

export function pickRecognizerName(names) {
  // A list of strings, not a recognizer.
  return names.find((name) => name.startsWith('speech'));
}
