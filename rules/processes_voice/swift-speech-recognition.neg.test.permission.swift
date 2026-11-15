// lexcode-expect: 0
import AVFoundation
import Speech

// Checking or asking for the speech recognition permission transcribes nothing, and
// AVSpeechSynthesizer reads typed text aloud (the definition leaves typed text out).
final class SpeechSettings {
    private let synthesizer = AVSpeechSynthesizer()

    var isAllowed: Bool {
        SFSpeechRecognizer.authorizationStatus() == .authorized
    }

    func ask() {
        SFSpeechRecognizer.requestAuthorization { status in
            print(status.rawValue)
        }
    }

    func readAloud(_ typed: String) {
        let utterance = AVSpeechUtterance(string: typed)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        synthesizer.speak(utterance)
    }
}
