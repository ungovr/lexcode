// lexcode-expect: 3
// A Vapor service that starts an Amazon Nova Reel text-to-video job on Bedrock and hands the job to the
// client, which plays the clip once it is ready.
import AWSBedrockRuntime
import AVFoundation
import Smithy
import Vapor

struct VideoController {
    let client: BedrockRuntimeClient

    func start(req: Request) async throws -> String {
        let prompt = try req.content.decode(String.self)
        let modelInput = try Document.make(from: ["taskType": "TEXT_VIDEO", "textToVideoParams": ["text": prompt]])
        let input = StartAsyncInvokeInput(
            modelId: "amazon.nova-reel-v1:1",
            modelInput: modelInput,
            outputDataConfig: .s3outputdataconfig(.init(s3Uri: "s3://clips"))
        )
        let output = try await client.startAsyncInvoke(input: input)
        return output.invocationArn ?? ""
    }

    func startOrFail(req: Request) async throws -> Response {
        let input = StartAsyncInvokeInput(modelId: "luma.ray-v2:0", modelInput: nil, outputDataConfig: nil)
        guard let arn = try await client.startAsyncInvoke(input: input).invocationArn else {
            throw Abort(.badRequest)
        }
        return Response(status: .accepted, body: .init(string: arn))
    }
}

final class ClipPreview {
    let client: BedrockRuntimeClient
    var player: AVPlayer?

    init(client: BedrockRuntimeClient) {
        self.client = client
    }

    func preview(_ input: StartAsyncInvokeInput) async throws {
        let output = try await client.startAsyncInvoke(input: input)
        player = AVPlayer(url: URL(string: "https://cdn.example.com/\(output.invocationArn ?? "")/output.mp4")!)
    }
}
