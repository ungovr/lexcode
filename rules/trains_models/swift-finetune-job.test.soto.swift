// lexcode-expect: 2
import Foundation
import SotoSageMaker
import SotoBedrock

// The same jobs from server-side Swift through Soto: a SageMaker training job and a Bedrock
// customization job.
struct TrainingService {
    let sageMaker: SageMaker
    let bedrock: Bedrock

    func start(request: SageMaker.CreateTrainingJobRequest) async throws {
        _ = try await sageMaker.createTrainingJob(request)
    }

    func customize(base: String, role: String) async throws {
        _ = try await bedrock.createModelCustomizationJob(.init(baseModelIdentifier: base, jobName: "tone", roleArn: role))
    }
}
