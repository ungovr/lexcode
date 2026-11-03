// lexcode-expect: 0
// A screen-and-camera recorder with no audio track, and a plain audio player.
// No human voice is captured or analyzed anywhere in this file.
export async function recordCameraClip(onDone) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const parts = [];
  recorder.ondataavailable = (event) => parts.push(event.data);
  recorder.onstop = () => onDone(new Blob(parts, { type: 'video/webm' }));
  recorder.start();
  return recorder;
}

export async function recordSilentPreview(video) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new MediaRecorder(stream);
}

export function playNotification(url) {
  const audio = new Audio(url);
  audio.volume = 0.4;
  return audio.play();
}

export function recordCanvas(canvas) {
  const stream = canvas.captureStream(30);
  return new MediaRecorder(stream, { mimeType: 'video/webm' });
}
