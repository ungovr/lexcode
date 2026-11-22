// lexcode-expect: 0
// Handlers of one statement that return Void or `()` in each spelling (typed throws, a parenthesized
// Void, the return type on its own line) have no implicit return, so the model call they make is not
// their response.
import AWSBedrockRuntime
import Vapor

struct VideoKickoff {
    let client: BedrockRuntimeClient

    func typed(req: Request) async throws(Abort) -> Void {
        _ = try? await client.startAsyncInvoke(input: StartAsyncInvokeInput(modelId: "amazon.nova-reel-v1:1", modelInput: nil, outputDataConfig: nil))
    }

    func typedQualified(req: Request) async throws(Abort) -> Swift.Void {
        _ = try? await client.startAsyncInvoke(input: StartAsyncInvokeInput(modelId: "amazon.nova-reel-v1:1", modelInput: nil, outputDataConfig: nil))
    }

    func paren(req: Request) async throws -> (Void) {
        _ = try await client.startAsyncInvoke(input: StartAsyncInvokeInput(modelId: "amazon.nova-reel-v1:1", modelInput: nil, outputDataConfig: nil))
    }

    func unit(req: Request) async throws -> () {
        _ = try await client.startAsyncInvoke(input: StartAsyncInvokeInput(modelId: "amazon.nova-reel-v1:1", modelInput: nil, outputDataConfig: nil))
    }

    func wrapped(req: Request) async throws
        -> () {
        _ = try await client.startAsyncInvoke(input: StartAsyncInvokeInput(modelId: "amazon.nova-reel-v1:1", modelInput: nil, outputDataConfig: nil))
    }
}
