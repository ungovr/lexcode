// lexcode-expect: 2
// A voice-note recorder: the microphone stream goes into a MediaRecorder and the
// finished clip is uploaded.
const chunks = [];

export async function startVoiceNote(onDone) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
    video: false,
  });
  const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  recorder.ondataavailable = (event) => chunks.push(event.data);
  recorder.onstop = () => onDone(new Blob(chunks, { type: 'audio/webm' }));
  recorder.start();
  return recorder;
}

export function startWithPromise(onDone) {
  return navigator.mediaDevices.getUserMedia({ audio: true }).then((micStream) => {
    const recorder = new MediaRecorder(micStream);
    recorder.ondataavailable = (event) => onDone(event.data);
    recorder.start(1000);
    return recorder;
  });
}
