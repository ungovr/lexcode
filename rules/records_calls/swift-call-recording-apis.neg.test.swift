// lexcode-expect: 0
import AgoraRtcKit
import CallKit
import Foundation

// Carrying a call keeps nothing and reads nothing: CallKit reports and places the call, Agora
// joins the channel. The recording device test records the local microphone before any call.
// A Twilio Video room with recording turned off records nobody.
final class VoipCalls: NSObject, CXProviderDelegate {
    private let provider = CXProvider(configuration: CXProviderConfiguration())
    private let controller = CXCallController()
    private var agoraKit: AgoraRtcEngineKit?

    func reportIncoming(uuid: UUID, handle: String) {
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .phoneNumber, value: handle)
        provider.reportNewIncomingCall(with: uuid, update: update) { error in
            print(error as Any)
        }
    }

    func startCall(uuid: UUID, handle: String) {
        let action = CXStartCallAction(call: uuid, handle: CXHandle(type: .generic, value: handle))
        controller.request(CXTransaction(action: action)) { error in
            print(error as Any)
        }
    }

    func join(channel: String, token: String) {
        agoraKit?.joinChannel(byToken: token, channelId: channel, info: nil, uid: 0)
        agoraKit?.startRecordingDeviceTest(500)
    }

    func providerDidReset(_ provider: CXProvider) {}

    let videoRoom = ["UniqueName": "standup", "RecordParticipantsOnConnect": "false"]
}
