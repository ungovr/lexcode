// lexcode-expect: 0
import UIKit

// The app's own types with Apple's short names, in a file without AVFoundation, AVFAudio or
// Speech: not the system microphone.
final class AVAudioRecorder {
    init(url: URL, settings: [String: Any]) throws {}
    func record() {}
}

final class Node {
    func installTap(onBus bus: Int, bufferSize: Int, format: String?, block: (Data, Int) -> Void) {}
}

enum AVMediaType {
    case audio
}

final class AVCaptureDevice {
    static func `default`(for type: AVMediaType) -> AVCaptureDevice? { AVCaptureDevice() }
}

final class PatchBay {
    let inputNode = Node()
}

final class SynthPatch {
    let bay = PatchBay()

    func makeRecorder(url: URL) throws -> AVAudioRecorder {
        try AVAudioRecorder(url: url, settings: [:])
    }

    func inputJack() -> AVCaptureDevice? {
        AVCaptureDevice.default(for: .audio)
    }

    func meter() {
        bay.inputNode.installTap(onBus: 0, bufferSize: 512, format: nil) { data, _ in
            print(data.count)
        }
    }
}
