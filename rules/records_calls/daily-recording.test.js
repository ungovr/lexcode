// lexcode-expect: 2
// Recording a Daily call from the browser: the call object starts a recording.
import Daily from '@daily-co/daily-js';

const call = Daily.createCallObject({ subscribeToTracksAutomatically: true });

export async function join(url, token) {
  await call.join({ url, token });
}

export function beginRecording() {
  call.startRecording({ layout: { preset: 'default' } });
}

export function beginRawTracks() {
  const frame = Daily.createFrame(document.getElementById('call'), { showLeaveButton: true });
  frame.startRecording({ type: 'raw-tracks' });
  return frame;
}

export function leave() {
  return call.leave();
}
