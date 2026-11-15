// lexcode-expect: 0
import Foundation

// The app's own methods with the vendors' names, in a file without the vendors' imports: a
// screen-capture helper and a lab-instrument logger, not call recording.
final class ScreenCapture {
    func startRecording() {}
    func startCloudRecording() -> Bool { true }
}

final class Instrument {
    func startAudioRecording(withConfig config: [String: String]) {}
    func createMediaCapturePipeline(input: String) {}
    func startContactRecording(input: String) {}
}

final class Lab {
    let capture = ScreenCapture()
    let instrument = Instrument()

    func run() {
        capture.startRecording()
        _ = capture.startCloudRecording()
        instrument.startAudioRecording(withConfig: ["rate": "48000"])
        instrument.createMediaCapturePipeline(input: "bench-1")
        instrument.startContactRecording(input: "probe-2")
    }
}
