// lexcode-expect: 7
import Foundation
import CreateML

// Create ML training on the app's own data: an image classifier from labeled folders (built
// directly, and as a training job), a text classifier, a recommender from what people did, a
// tabular regressor and an object detector job.
final class Trainer {
    func images(at url: URL, output: URL) throws {
        let classifier = try MLImageClassifier(trainingData: .labeledDirectories(at: url))
        try classifier.write(to: output)
    }

    func imageJob(at url: URL) throws {
        let job = try MLImageClassifier.train(
            trainingData: .labeledDirectories(at: url),
            parameters: MLImageClassifier.ModelParameters()
        )
        _ = job
    }

    func reviews(table: MLDataTable) throws {
        let model = try MLTextClassifier(trainingData: table, textColumn: "text", labelColumn: "label")
        _ = model
    }

    func recommendations(activity: MLDataTable) async throws {
        let recommender = try await Task { try MLRecommender(trainingData: activity, userColumn: "user", itemColumn: "item") }.value
        _ = recommender
    }

    func prices(table: MLDataTable) throws {
        let regressor = try MLBoostedTreeRegressor(trainingData: table, targetColumn: "price")
        _ = regressor
    }

    func detector(at url: URL) throws {
        _ = try MLObjectDetector.train(trainingData: .directoryWithImages(at: url), parameters: .init())
    }

    func tagger(table: MLDataTable) throws {
        _ = try MLWordTagger(trainingData: table, tokenColumn: "tokens", labelColumn: "labels")
    }
}
