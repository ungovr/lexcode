// lexcode-expect: 0
import AVFoundation
import CallKit
import LiveKit

// A call carried, not kept: CallKit's audio session set up and a ringback tone played, and a
// LiveKit video track drawn on screen.
final class CallAudio: NSObject, CXProviderDelegate {
    private var ringback: AVAudioPlayer?

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        try? audioSession.setCategory(.playAndRecord, mode: .voiceChat)
        ringback = try? AVAudioPlayer(contentsOf: URL(fileURLWithPath: "/ringback.caf"))
        ringback?.play()
    }

    func providerDidReset(_ provider: CXProvider) {}

    func placeholder() -> AVAudioRecorder {
        AVAudioRecorder()
    }

    func show(track: RemoteVideoTrack, in view: VideoView) {
        track.add(videoRenderer: view)
    }
}
