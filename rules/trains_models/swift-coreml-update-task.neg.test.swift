// lexcode-expect: 0
import Foundation
import CoreML

// Running a model someone else trained, on the device: compiling and loading it, asking it for a
// prediction, and reading whether it is updatable without updating it.
final class Predictor {
    func predict(modelURL: URL, input: MLFeatureProvider) async throws -> MLFeatureProvider {
        let compiled = try await MLModel.compileModel(at: modelURL)
        let model = try MLModel(contentsOf: compiled, configuration: MLModelConfiguration())
        _ = model.modelDescription.isUpdatable
        return try model.prediction(from: input)
    }
}
