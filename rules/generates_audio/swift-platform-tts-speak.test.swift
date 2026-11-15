// lexcode-expect: 3
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

    func readMarkup(_ ssml: String) {
        if let utterance = AVSpeechUtterance(ssmlRepresentation: ssml) {
            synthesizer.speak(utterance)
        }
    }
}
