// lexcode-expect: 3
// Recording the far end of a WebRTC call in the browser: the recorder is built
// from the stream that arrives from the other participant.
const recordings = new Map();

export function recordRemoteWithOnTrack(pc, callId) {
  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    const recorder = new MediaRecorder(remoteStream, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (e) => recordings.set(callId, e.data);
    recorder.start(5000);
  };
}

export function recordRemoteWithListener(pc, upload) {
  pc.addEventListener('track', function (event) {
    const recorder = new MediaRecorder(event.streams[0]);
    recorder.ondataavailable = (e) => upload(e.data);
    recorder.start();
  });
}

export function recordPeerStream(peer, upload) {
  peer.on('stream', (remoteStream) => {
    const recorder = new MediaRecorder(remoteStream);
    recorder.ondataavailable = (e) => upload(e.data);
    recorder.start(1000);
  });
}
