// lexcode-expect: 2
import Foundation
import CreateMLComponents
import TabularData

// Create ML Components: an estimator pipeline fitted to the app's own data, awaited, and with a
// validation set.
final class PipelineTrainer {
    func train<E: SupervisedTabularEstimator>(estimator: E, data: DataFrame, validation: DataFrame) async throws {
        let fitted = try await estimator.fitted(to: data)
        _ = fitted
        let checked = try await estimator.fitted(to: data, validateOn: validation) { event in
            print(event)
        }
        _ = checked
    }
}
