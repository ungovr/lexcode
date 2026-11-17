// lexcode-expect: 0
import Foundation
import TTSKit
import WhisperKit
import whisper

// Model management and speech synthesis, with the libraries imported: a download, a listing, a
// configuration, TTSKit reading typed text aloud, and whisper.cpp's helpers that load nothing and
// transcribe nothing.
final class ModelStore {
    func prepare() async throws -> URL {
        let available = try await WhisperKit.fetchAvailableModels()
        let config = WhisperKitConfig(model: available.first ?? "base", download: false)
        _ = config
        return try await WhisperKit.download(variant: "base")
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
