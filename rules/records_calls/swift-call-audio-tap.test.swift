// lexcode-expect: 4
import AVFoundation
import CallKit

// A VoIP call's provider delegate that records the call audio once CallKit activates the session.
final class CallRecorder: NSObject, CXProviderDelegate {
    private let engine = AVAudioEngine()
    private var recorder: AVAudioRecorder?

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("call.m4a")
        recorder = try? AVAudioRecorder(url: url, settings: [AVFormatIDKey: Int(kAudioFormatMPEG4AAC)])
        recorder?.record()
        engine.inputNode.installTap(onBus: 0, bufferSize: 4096, format: nil) { buffer, _ in
            print(buffer.frameLength)
        }
        let input = engine.inputNode
        input.installTap(onBus: 1, bufferSize: 4096, format: nil) { buffer, _ in
            print(buffer.frameLength)
        }
    }

    func providerDidReset(_ provider: CXProvider) {
        recorder?.stop()
    }

    func recordAnswered(call: CXAnswerCallAction, store: CallStore) async throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(call.callUUID).m4a")
        try await store.keep(AVAudioRecorder(url: url, settings: [:]))
    }
}

actor CallStore {
    func keep(_ recorder: AVAudioRecorder) throws {
        recorder.record()
    }
}
