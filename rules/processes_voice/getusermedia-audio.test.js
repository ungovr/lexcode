// lexcode-expect: 3
// Opening the microphone. What happens to the audio next decides whether the app
// keeps or reads it, so a match is only worth a look.
export async function openMic() {
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export async function openCallStreams(pc) {
  const local = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true },
    video: { facingMode: 'user' },
  });
  local.getTracks().forEach((track) => pc.addTrack(track, local));
  return local;
}

export function openMicWithCallback(onStream, onError) {
  navigator.mediaDevices.getUserMedia({ audio: { deviceId: 'default' } }).then(onStream).catch(onError);
}
