// lexcode-expect: 0
import Foundation

// The app's own types with Create ML's names, in a file that imports neither CreateML nor
// CreateMLComponents: a rules engine that "trains" by storing examples, and a layout fitter.
final class MLImageClassifier {
    init(trainingData: [String]) {}
    static func train(trainingData: [String]) -> MLImageClassifier { MLImageClassifier(trainingData: trainingData) }
}

final class MLTextClassifier {
    init(trainingData: [String], textColumn: String, labelColumn: String) {}
}

struct Layout {
    func fitted(to size: Int) async throws -> Layout { self }
}

final class Rules {
    func build(examples: [String]) async throws {
        _ = MLImageClassifier(trainingData: examples)
        _ = MLImageClassifier.train(trainingData: examples)
        _ = MLTextClassifier(trainingData: examples, textColumn: "t", labelColumn: "l")
        _ = try await Layout().fitted(to: 3)
    }
}
