// lexcode-expect: 0
import AVFoundation

// Recording your own voice alone, with no call in the file, is processes_voice, not records_calls.
final class VoiceMemo {
    private let engine = AVAudioEngine()

    func record(to url: URL) throws -> AVAudioRecorder {
        let recorder = try AVAudioRecorder(url: url, settings: [:])
        recorder.record()
        return recorder
    }

    func listen() {
        engine.inputNode.installTap(onBus: 0, bufferSize: 1024, format: nil) { buffer, _ in
            print(buffer.frameLength)
        }
    }
}
