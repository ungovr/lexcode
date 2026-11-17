// lexcode-expect: 1
import Foundation

// No WhisperKit import here: the module comes in through an `@_exported import` in another file of
// the target. The pipeline's initializer carries the product's own name and is matched; its
// `transcribe` call is a name any app may use, and without the import it is not (a known gap).
final class ExportedDictation {
    var pipe: WhisperKit?

    func load() async throws {
        pipe = try await WhisperKit()
    }

    func run(_ path: String) async throws -> String {
        let results = try await pipe?.transcribe(audioPath: path)
        return results?.first?.text ?? ""
    }
}
