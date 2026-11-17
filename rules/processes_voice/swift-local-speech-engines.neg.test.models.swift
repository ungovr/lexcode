// lexcode-expect: 0
import Foundation
import TTSKit
import WhisperKit
import whisper

// Model management and speech synthesis, with the libraries imported: a download, a listing, a
// configuration, a pipeline made only to download a model (`load: false`), the app's own method
// named `transcribe` called on itself, TTSKit reading typed text aloud, and whisper.cpp's helpers
// that load nothing and transcribe nothing.
final class ModelStore {
    func prepare() async throws -> URL {
        let available = try await WhisperKit.fetchAvailableModels()
        let config = WhisperKitConfig(model: available.first ?? "base", download: false)
        _ = config
        return try await WhisperKit.download(variant: "base")
    }

    func fetchOnly() async throws {
        _ = try await WhisperKit(WhisperKitConfig(model: "tiny", download: true, prewarm: false, load: false))
        _ = try await WhisperKit.WhisperKit(model: "tiny", prewarm: false, load: false, download: true)
    }

    func transcribe(audioPath: String) async throws -> String { audioPath }

    func upload(_ path: String) async throws -> String {
        let first = try await self.transcribe(audioPath: path)
        let second = try await transcribe(audioPath: path)
        return first + second
    }

    func speak(_ text: String) async throws {
        let tts = try await TTSKit()
        try await tts.play(text: text)
    }

    func info() -> String {
        let params = whisper_context_default_params()
        _ = params
        return String(cString: whisper_print_system_info())
    }

    func release(_ ctx: OpaquePointer) {
        whisper_free(ctx)
    }
}
