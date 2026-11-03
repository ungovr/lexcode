# lexcode-expect: 2
# A Python WebRTC endpoint that writes each remote participant's audio to a file.
from aiortc import RTCPeerConnection
from aiortc.contrib.media import MediaRecorder


async def answer(offer, call_id):
    pc = RTCPeerConnection()
    recorder = MediaRecorder(f"calls/{call_id}.wav")

    @pc.on("track")
    def on_track(track):
        if track.kind == "audio":
            recorder.addTrack(track)

    await pc.setRemoteDescription(offer)
    await recorder.start()
    return pc


async def answer_async(offer, call_id):
    pc = RTCPeerConnection()
    recorder = MediaRecorder(f"calls/{call_id}.mp4")

    @pc.on("track")
    async def on_track(track):
        recorder.addTrack(track)

    await pc.setRemoteDescription(offer)
    return pc
