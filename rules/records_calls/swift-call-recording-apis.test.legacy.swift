// lexcode-expect: 2
import AgoraRtcEngineKit
import UIKit

// Agora 2.x, whose module was AgoraRtcEngineKit.
final class LegacyCallViewController: UIViewController {
    var agoraKit: AgoraRtcEngineKit!

    func recordChannel(path: String) {
        agoraKit.startAudioRecording(path, quality: .medium)
    }

    @MainActor
    func recordFromTask(path: String, kit: AgoraRtcEngineKit) async throws {
        try await Task.sleep(nanoseconds: 1_000_000)
        _ = await kit.startAudioRecording(path, quality: .low)
    }
}
