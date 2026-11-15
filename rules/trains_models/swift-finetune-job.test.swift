// lexcode-expect: 3
import Foundation
import SwiftOpenAI
import AWSSageMaker
import AWSBedrock

// Hosted fine-tuning and training jobs on the app's own data: an OpenAI fine-tuning job through
// SwiftOpenAI, a SageMaker training job and a Bedrock model customization job through the AWS SDK
// for Swift.
final class Tuner {
    let service: OpenAIService
    let sage: AWSSageMaker.SageMakerClient
    let bedrock: AWSBedrock.BedrockClient

    init(service: OpenAIService, sage: AWSSageMaker.SageMakerClient, bedrock: AWSBedrock.BedrockClient) {
        self.service = service
        self.sage = sage
        self.bedrock = bedrock
    }

    func openAI(trainingFileID: String) async throws {
        let parameters = FineTuningJobParameters(model: .gpt35, trainingFile: trainingFileID)
        let job = try await service.createFineTuningJob(parameters: parameters)
        _ = job
    }

    func sageMaker(name: String, role: String) async throws {
        _ = try await sage.createTrainingJob(input: CreateTrainingJobInput(roleArn: role, trainingJobName: name))
    }

    func customize(base: String, role: String) async throws {
        let output = try await bedrock.createModelCustomizationJob(
            input: CreateModelCustomizationJobInput(baseModelIdentifier: base, jobName: "support-tone", roleArn: role)
        )
        _ = output
    }
}
