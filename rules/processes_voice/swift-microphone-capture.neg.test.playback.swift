// lexcode-expect: 0
import AVFoundation

// Playing sound and reading typed text aloud: no one's voice is captured. Asking for the
// microphone permission alone records nothing.
final class Playback {
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let synthesizer = AVSpeechSynthesizer()

    func play(url: URL) throws -> AVAudioPlayer {
        let audio = try AVAudioPlayer(contentsOf: url)
        audio.play()
        return audio
    }

    // A tap on the mixer hears what the app plays (a visualizer), not the microphone.
    func visualize() throws {
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: nil)
        engine.mainMixerNode.installTap(onBus: 0, bufferSize: 1024, format: nil) { buffer, _ in
            print(buffer.frameLength)
        }
        try engine.start()
    }

    // Text the user typed, read aloud.
    func speak(_ typed: String) {
        synthesizer.speak(AVSpeechUtterance(string: typed))
    }

    func askForMicrophone() {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            print(granted)
        }
    }

    // A recorder made with no URL, the fallback when a real one cannot be made, records nothing.
    func placeholderRecorder() -> AVAudioRecorder {
        AVAudioRecorder()
    }

    func camera() -> AVCaptureDevice? {
        AVCaptureDevice.default(for: .video)
    }
}
