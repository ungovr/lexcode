// lexcode-expect: 4
import Foundation
import SwiftWhisper

final class VoiceMemoTranscriber {
    private let whisper: Whisper
    private let fallback: Whisper

    init(model: URL, data: Data) {
        whisper = Whisper(fromFileURL: model)
        fallback = SwiftWhisper.Whisper(fromData: data, withParams: .default)
    }

    func transcribe(_ frames: [Float]) async throws -> String {
        let segments = try await whisper.transcribe(audioFrames: frames)
        return segments.map(\.text).joined()
    }

    func transcribeFallback(_ frames: [Float]) async throws -> String {
        let segments = try await fallback
            .transcribe(
                audioFrames: frames
            )
        return segments.map(\.text).joined()
    }
}
