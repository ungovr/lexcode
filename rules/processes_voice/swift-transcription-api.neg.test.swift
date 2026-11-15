// lexcode-expect: 0
import Foundation

// The app's own methods with the vendors' names, in a file without OpenAI, SwiftOpenAI or the
// AWS Transcribe modules: a subtitles store, not a speech-to-text service.
final class SubtitleStore {
    func audioTranscriptions(query: String) -> [String] { [query] }
    func createTranscription(parameters: [String: String]) -> String { parameters["text"] ?? "" }
    func startTranscriptionJob(input: String) {}
}

final class Library {
    let store = SubtitleStore()

    func load() {
        _ = store.audioTranscriptions(query: "episode-1")
        _ = store.createTranscription(parameters: ["text": "Hello"])
        store.startTranscriptionJob(input: "episode-2")
    }
}
