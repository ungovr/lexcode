// lexcode-expect: 0
import Foundation
import CreateML
import CoreML
import Vision

// Using models without training one: loading a compiled Core ML model and classifying with it,
// running it through Vision, reading a table and building training parameters that are never
// used to train.
final class Classifier {
    func classify(modelURL: URL, image: CGImage) throws -> [VNClassificationObservation] {
        let model = try MLModel(contentsOf: modelURL)
        let request = VNCoreMLRequest(model: try VNCoreMLModel(for: model))
        try VNImageRequestHandler(cgImage: image).perform([request])
        return request.results as? [VNClassificationObservation] ?? []
    }

    func inspect(csv: URL) throws -> Int {
        let table = try MLDataTable(contentsOf: csv)
        let parameters = MLImageClassifier.ModelParameters(maxIterations: 10)
        _ = parameters
        return table.rows.count
    }
}
