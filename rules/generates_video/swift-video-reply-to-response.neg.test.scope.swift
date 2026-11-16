// lexcode-expect: 0
// The model's output goes into a local variable with an output name, in a function that has a return type,
// and is never shown or sent: a local is not a screen. Without the local-`var` exclusions each assignment
// below would be a state-sink match. Nothing the model wrote is returned.
import AWSBedrockRuntime

struct ClipLog {
    let client: BedrockRuntimeClient

    func measure(_ input: StartAsyncInvokeInput) async throws -> Int {
        var clip = ""
        let output = try await client.startAsyncInvoke(input: input)
        clip = output.invocationArn ?? ""
        print(clip.isEmpty, "amazon.nova-reel-v1:1")
        return 1
    }

    func measureTyped(_ input: StartAsyncInvokeInput) async throws -> Int {
        var videoID: String = ""
        let output = try await client.startAsyncInvoke(input: input)
        videoID = output.invocationArn ?? ""
        print(videoID.isEmpty)
        return 1
    }
}
