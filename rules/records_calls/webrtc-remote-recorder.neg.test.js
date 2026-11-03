// lexcode-expect: 0
// A call that is carried and not kept, and a recorder of the user's own screen.
// The remote stream goes to a video element; nothing writes it down.
export function playRemote(pc, videoElement) {
  pc.ontrack = (event) => {
    videoElement.srcObject = event.streams[0];
    videoElement.play();
  };
}

export function countParticipants(pc, onCount) {
  pc.addEventListener('track', () => {
    onCount(pc.getReceivers().length);
  });
}

export function relayPeerStream(peer, otherPeer) {
  peer.on('stream', (remoteStream) => {
    otherPeer.addStream(remoteStream);
  });
}

export async function recordOwnScreen() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  recorder.start();
  return recorder;
}
