// lexcode-expect: 4
import AgoraRtcKit
import Daily
import ZoomVideoSDK

final class CallSession: NSObject {
    private var agoraKit: AgoraRtcEngineKit?
    private let callClient = CallClient()

    // Agora 4.x: the channel's mixed audio to a file
    func recordChannel(to path: String) {
        let config = AgoraAudioRecordingConfiguration()
        config.filePath = path
        config.recordingPosition = .positionMixedRecordingAndPlayback
        agoraKit?.startAudioRecording(withConfig: config)
    }

    // Agora 3.x
    func recordChannelLegacy(to path: String) {
        agoraKit?.startAudioRecording(path,
                                      quality: .high)
    }

    func recordCloud() {
        let helper = ZoomVideoSDK.shareInstance()?.getRecordingHelper()
        _ = helper?.startCloudRecording()
    }

    func recordDailyCall() async throws {
        try await callClient.startRecording()
    }
}
