// lexcode-expect: 0
// Camera-only capture, device listing and sound playback: no microphone is opened.
export async function openCamera(video) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  video.srcObject = stream;
  return stream;
}

export async function openCameraOnly() {
  return navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 } } });
}

export async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'videoinput');
}

export function ringTone() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.frequency.value = 440;
  osc.connect(ctx.destination);
  osc.start();
  return osc;
}
