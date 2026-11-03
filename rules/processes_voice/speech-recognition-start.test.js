// lexcode-expect: 3
// Browser speech recognition: the Web Speech API turns what the user says into text.
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function listen(onText) {
  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    onText(last[0].transcript);
  };
  recognition.start();
  return recognition;
}

export function listenPrefixed(onText) {
  const rec = new webkitSpeechRecognition();
  rec.continuous = true;
  rec.onresult = (e) => onText(e.results[0][0].transcript);
  rec.start();
  return rec;
}

export function listenDirect(onText) {
  const rec = new window.SpeechRecognition();
  rec.addEventListener('result', (e) => onText(e.results[0][0].transcript));
  rec.start();
}
