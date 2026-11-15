// lexcode-expect: 0
import Foundation
import SwiftOpenAI
import AWSSageMaker
import SotoSageMaker

// Hosted AI services used without training anything: a chat completion, reading the list and
// status of existing fine-tuning jobs, cancelling one, and describing and listing SageMaker
// training jobs.
final class Assistant {
    let service: OpenAIService
    let sage: AWSSageMaker.SageMakerClient
    let soto: SageMaker

    init(service: OpenAIService, sage: AWSSageMaker.SageMakerClient, soto: SageMaker) {
        self.service = service
        self.sage = sage
        self.soto = soto
    }

    func ask(_ text: String) async throws {
        let parameters = ChatCompletionParameters(messages: [.init(role: .user, content: .text(text))], model: .gpt4o)
        _ = try await service.startChat(parameters: parameters)
    }

    func jobs(id: String) async throws {
        _ = try await service.istFineTuningJobs()
        _ = try await service.retrieveFineTuningJob(id: id)
        _ = try await service.cancelFineTuningJobWith(id: id)
        _ = try await service.listFineTuningEventsForJobWith(id: id, after: nil, limit: nil)
    }

    func status(name: String) async throws {
        _ = try await sage.describeTrainingJob(input: DescribeTrainingJobInput(trainingJobName: name))
        _ = try await sage.listTrainingJobs(input: ListTrainingJobsInput(maxResults: 10))
        _ = try await soto.describeTrainingJob(.init(trainingJobName: name))
    }
}
