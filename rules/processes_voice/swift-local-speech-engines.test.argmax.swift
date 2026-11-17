// lexcode-expect: 3
import ArgmaxOSS
import Foundation

// ArgmaxOSS re-exports WhisperKit (`@_exported import WhisperKit`), so its methods count here too.
struct MeetingNotes {
    let kit: WhisperKit

    static func make() async throws -> MeetingNotes {
        MeetingNotes(kit: try await WhisperKit(WhisperKitConfig(model: "base")))
    }

    func transcribe(_ samples: [Float]) async throws -> String {
        let results = try await kit.transcribe(audioArray: samples)
        return results.map { $0.text }.joined(separator: " ")
    }

    func language(_ samples: [Float]) async throws -> String {
        try await kit.detectLangauge(audioArray: samples).language
    }
}
