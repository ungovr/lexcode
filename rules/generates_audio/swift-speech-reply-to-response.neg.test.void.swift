// lexcode-expect: 0
// Handlers of one statement that return Void or `()` in each spelling (typed throws, a parenthesized
// Void, the return type on its own line) have no implicit return, so the model call they make is not
// their response.
import AWSPolly
import Vapor

struct SpeechWarmup {
    let polly: PollyClient

    func typed(req: Request) async throws(Abort) -> Void {
        _ = try? await polly.synthesizeSpeech(input: SynthesizeSpeechInput(text: "hi", voiceId: .joanna))
    }

    func typedQualified(req: Request) async throws(Abort) -> Swift.Void {
        _ = try? await polly.synthesizeSpeech(input: SynthesizeSpeechInput(text: "hi", voiceId: .joanna))
    }

    func paren(req: Request) async throws -> (Void) {
        _ = try await polly.synthesizeSpeech(input: SynthesizeSpeechInput(text: "hi", voiceId: .joanna))
    }

    func unit(req: Request) async throws -> () {
        _ = try await polly.synthesizeSpeech(input: SynthesizeSpeechInput(text: "hi", voiceId: .joanna))
    }

    func wrapped(req: Request) async throws
        -> () {
        _ = try await polly.synthesizeSpeech(input: SynthesizeSpeechInput(text: "hi", voiceId: .joanna))
    }
}
