// lexcode-expect: 8
import AVFoundation
import Speech

final class Dictation {
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()

    func defaultRecognizer() -> SFSpeechRecognizer? {
        SFSpeechRecognizer()
    }

    func startLive() throws {
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        recognizer?.recognitionTask(with: request) { result, _ in
            print(result?.bestTranscription.formattedString ?? "")
        }
        try audioEngine.start()
    }

    func transcribe(file url: URL) {
        let request = SFSpeechURLRecognitionRequest(
            url: url
        )
        recognizer?.recognitionTask(with: request, resultHandler: { result, _ in
            print(result?.isFinal ?? false)
        })
    }

    @available(iOS 26.0, macOS 26.0, *)
    func analyze(file: AVAudioFile) async throws {
        let transcriber = SpeechTranscriber(locale: Locale.current,
                                            transcriptionOptions: [],
                                            reportingOptions: [.volatileResults],
                                            attributeOptions: [])
        let analyzer = SpeechAnalyzer(modules: [transcriber])
        try await analyzer.start(inputAudioFile: file, finishAfterFile: true)
        for try await result in transcriber.results {
            print(result.text)
        }
    }

    @available(iOS 26.0, macOS 26.0, *)
    func analyzeInline(file: AVAudioFile, transcriber: SpeechTranscriber) async throws {
        try await SpeechAnalyzer(modules: [transcriber]).start(inputAudioFile: file, finishAfterFile: true)
    }

    @available(iOS 26.0, macOS 26.0, *)
    func dictation() -> DictationTranscriber {
        DictationTranscriber(locale: .current, preset: .shortDictation)
    }
}
