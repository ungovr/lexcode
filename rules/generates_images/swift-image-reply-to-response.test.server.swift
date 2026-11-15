// lexcode-expect: 2
// A Vapor service that renders a picture with Amazon Nova Canvas on Bedrock and returns it.
import AWSBedrockRuntime
import Foundation
import Vapor

struct NovaImageOutput: Decodable {
    let images: [Data]
}

struct ImageController {
    let client: BedrockRuntimeClient

    func render(req: Request) async throws -> Response {
        let prompt = try req.content.decode(String.self)
        let input = InvokeModelInput(
            accept: "application/json",
            body: Data("{\"textToImageParams\":{\"text\":\"\(prompt)\"},\"taskType\":\"TEXT_IMAGE\"}".utf8),
            modelId: "amazon.nova-canvas-v1:0"
        )
        let response = try await client.invokeModel(input: input)
        let output = try JSONDecoder().decode(NovaImageOutput.self, from: response.body!)
        return Response(status: .ok, body: .init(data: output.images[0]))
    }

    func renderBytes(req: Request) async throws -> Data {
        let input = InvokeModelInput(body: Data(), modelId: "amazon.nova-canvas-v1:0")
        let response = try await client.invokeModel(input: input)
        return response.body ?? Data()
    }
}
