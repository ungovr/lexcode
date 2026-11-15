// lexcode-expect: 0
import Foundation

// The app's own job service with the vendors' method names, in a file that imports none of
// SwiftOpenAI, the AWS SDK for Swift or Soto: a print shop's queue.
final class PrintQueue {
    func createFineTuningJob(parameters: [String: String]) async throws {}
    func createTrainingJob(input: [String: String]) async throws {}
    func createModelCustomizationJob(input: [String: String]) async throws {}
}

final class Shop {
    let queue = PrintQueue()

    func submit() async throws {
        try await queue.createFineTuningJob(parameters: ["paper": "matte"])
        try await queue.createTrainingJob(input: ["staff": "new"])
        try await queue.createModelCustomizationJob(input: ["model": "poster"])
    }
}
