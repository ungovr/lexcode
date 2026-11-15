// lexcode-expect: 4
// The app reads text aloud with AVSpeechSynthesizer: a plain string, an attributed string and SSML.
import AVFoundation

final class ReadAloud {
    let synthesizer = AVSpeechSynthesizer()

    func read(_ text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        synthesizer.speak(utterance)
    }

    func readStyled(_ text: NSAttributedString) {
        synthesizer.speak(AVFoundation.AVSpeechUtterance(attributedString: text))
    }

    func readFetched(_ load: () async throws -> String) async throws {
        let utterance = try await AVSpeechUtterance(string: load())
        synthesizer.speak(utterance)
    }

    func readMarkup(_ ssml: String) {
        if let utterance = AVSpeechUtterance(ssmlRepresentation: ssml) {
            synthesizer.speak(utterance)
        }
    }
}
