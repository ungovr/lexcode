// lexcode-expect: 3
import Foundation

// An app's extension of WhisperKit, in a file that gets the type through an `@_exported import`
// elsewhere: `self` and a bare call are WhisperKit's own methods.
extension WhisperKit {
    func quickText(_ path: String) async throws -> String {
        let results = try await self.transcribe(audioPath: path)
        return results.map(\.text).joined(separator: " ")
    }

    func samples(_ audio: [Float]) async throws -> [TranscriptionResult] {
        try await transcribe(audioArray: audio)
    }

    func language(of path: String) async throws -> String {
        try await self.detectLanguage(audioPath: path).language
    }
}
