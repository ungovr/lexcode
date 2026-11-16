// lexcode-expect: 0
// Bedrock's StartAsyncInvoke in a file that names no video model (an embedding job for the team's own
// search index), an app type with its own startAsyncInvoke, and footage a person shot that the app only
// plays: the definition's exclusion.
import AVFoundation
import AWSBedrockRuntime
import Vapor

struct EmbeddingJobs {
    let client: BedrockRuntimeClient

    func index(req: Request) async throws -> String {
        let input = StartAsyncInvokeInput(modelId: "twelvelabs.marengo-embed-2-7-v1:0", modelInput: nil, outputDataConfig: nil)
        let output = try await client.startAsyncInvoke(input: input)
        return output.invocationArn ?? ""
    }
}

struct RenderQueue {
    func startAsyncInvoke(input: String) async throws -> String { input }
}

final class ClipPlayer {
    let queue = RenderQueue()
    var player: AVPlayer?

    func play(recording url: URL) {
        player = AVPlayer(url: url)
        player?.play()
    }

    func queued(req: Request) async throws -> String {
        let id = try await queue.startAsyncInvoke(input: "trim")
        return id
    }
}
