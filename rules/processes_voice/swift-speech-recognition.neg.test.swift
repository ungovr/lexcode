// lexcode-expect: 0
import Foundation

// The app's own types with the Speech framework's short names, in a file without
// `import Speech`: a speech-bubble layout engine, not speech recognition.
struct SpeechTranscriber {
    let locale: Locale
    func layout(_ text: String) -> [String] { text.components(separatedBy: " ") }
}

final class SpeechAnalyzer {
    init(modules: [SpeechTranscriber]) {}
}

final class SFSpeechRecognizer {
    init?(locale: Locale) {}
}

final class Bubbles {
    func make() {
        let transcriber = SpeechTranscriber(locale: .current)
        let analyzer = SpeechAnalyzer(modules: [transcriber])
        let recognizer = SFSpeechRecognizer(locale: .current)
        print(analyzer, recognizer as Any)
    }
}
