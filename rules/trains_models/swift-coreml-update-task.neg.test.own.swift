// lexcode-expect: 0
import Foundation

// The app's own MLUpdateTask, in a file that does not import Core ML: a sync job for a list of
// models the user follows.
final class MLUpdateTask {
    init(forModelAt url: URL, trainingData: [String], configuration: Any?, completionHandler: @escaping (Bool) -> Void) {}
    func resume() {}
}

final class Sync {
    func run(url: URL) {
        let task = MLUpdateTask(forModelAt: url, trainingData: ["a"], configuration: nil) { _ in }
        task.resume()
    }
}
