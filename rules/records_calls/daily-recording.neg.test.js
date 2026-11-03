// lexcode-expect: 0
// A Daily call that is joined, muted and left but never recorded, and a local
// object that has its own startRecording method.
import Daily from '@daily-co/daily-js';

const call = Daily.createCallObject();

export async function join(url, token) {
  await call.join({ url, token });
  call.setLocalAudio(true);
}

export function toggleMute() {
  call.setLocalAudio(!call.localAudio());
}

export async function leave() {
  await call.leave();
  call.destroy();
}

const metronome = {
  startRecording() {
    return 'a practice tool that logs its own beat, no call involved';
  },
};

export function practice() {
  return metronome.startRecording();
}
