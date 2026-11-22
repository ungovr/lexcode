// lexcode-expect: 1
// A service that keeps its video jobs in a list named for results.
import AWSBedrockRuntime
import Foundation

final class ReelJobs {
    let client: BedrockRuntimeClient
    var results: [String] = []

    init(client: BedrockRuntimeClient) { self.client = client }

    func start() async throws {
        let input = StartAsyncInvokeInput(modelId: "amazon.nova-reel-v1:1", modelInput: nil, outputDataConfig: nil)
        let output = try await client.startAsyncInvoke(input: input)
        results.append(output.invocationArn ?? "")
    }
}
