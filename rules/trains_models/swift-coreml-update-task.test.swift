// lexcode-expect: 3
import Foundation
import CoreML

// On-device training: an updatable Core ML model retrained on the person's own examples, with a
// completion handler, with progress handlers, and built inside an awaited call.
final class Personalizer {
    func update(modelURL: URL, examples: MLBatchProvider, output: URL) throws {
        let task = try MLUpdateTask(forModelAt: modelURL, trainingData: examples, configuration: nil, completionHandler: { context in
            try? context.model.write(to: output)
        })
        task.resume()
    }

    func updateWithProgress(modelURL: URL, examples: MLBatchProvider) throws {
        let handlers = MLUpdateProgressHandlers(forEvents: [.epochEnd], progressHandler: { _ in }, completionHandler: { _ in })
        let task = try MLUpdateTask(
            forModelAt: modelURL,
            trainingData: examples,
            configuration: MLModelConfiguration(),
            progressHandlers: handlers
        )
        task.resume()
    }

    func updateAsync(modelURL: URL, examples: MLBatchProvider) async throws {
        let task = try await Self.started(try MLUpdateTask(forModelAt: modelURL, trainingData: examples, configuration: nil) { _ in })
        _ = task
    }

    static func started(_ task: MLUpdateTask) async throws -> MLUpdateTask {
        task.resume()
        return task
    }
}
