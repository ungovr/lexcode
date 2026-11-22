// lexcode-expect: 0
import Foundation

// The nearest lookalikes, in a file that imports none of the libraries: an app's own OpenAI
// client named Whisper, and its own transcriber with the same method names.
struct Whisper {
    let apiKey: String
    init(fromFileURL url: URL) { apiKey = url.lastPathComponent }
}

final class AudioStreamTranscriber {
    init(name: String) {}
}

final class AppTranscriber {
    func transcribe(audioPath: String) async -> String { audioPath }
    func transcribe(audioArray: [Float]) async -> String { "" }
    func transcribe(audioFrames: [Float]) async -> String { "" }
    func detectLanguage(audioPath: String) async -> String { "en" }

    func run() async {
        let client = Whisper(fromFileURL: URL(fileURLWithPath: "/tmp/key"))
        _ = AudioStreamTranscriber(name: client.apiKey)
        _ = await transcribe(audioPath: "/tmp/a.wav")
        _ = await self.transcribe(audioArray: [])
        _ = await self.transcribe(audioFrames: [])
        _ = await self.detectLanguage(audioPath: "/tmp/a.wav")
    }
}

// The app's own transcriber extended, and an extension of a type whose name only ends in WhisperKit.
extension AppTranscriber {
    func again() async {
        _ = await self.transcribe(audioPath: "/tmp/b.wav")
        _ = await transcribe(audioArray: [])
    }
}

final class MyWhisperKit {
    func transcribe(audioPath: String) async -> String { audioPath }
}

extension MyWhisperKit {
    func again() async {
        _ = await self.transcribe(audioPath: "/tmp/c.wav")
    }
}
