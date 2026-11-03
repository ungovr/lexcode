# lexcode-expect: 0
# Python WebRTC endpoints that relay or play the remote track, or record a local
# file, without writing the remote participant's audio down.
from aiortc import RTCPeerConnection
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder, MediaRelay

relay = MediaRelay()


async def forward(offer, other_pc):
    pc = RTCPeerConnection()

    @pc.on("track")
    def on_track(track):
        other_pc.addTrack(relay.subscribe(track))

    await pc.setRemoteDescription(offer)
    return pc


async def discard(offer):
    pc = RTCPeerConnection()
    sink = MediaBlackhole()

    @pc.on("track")
    def on_track(track):
        sink.addTrack(track)

    await pc.setRemoteDescription(offer)
    await sink.start()
    return pc


def copy_local_file(src, dst):
    player = MediaPlayer(src)
    recorder = MediaRecorder(dst)
    recorder.addTrack(player.audio)
    return recorder
