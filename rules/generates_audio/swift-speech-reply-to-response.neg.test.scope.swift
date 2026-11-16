// lexcode-expect: 0
// The model's output goes into a local variable with an output name, in a function that has a return type,
// and is never shown or sent: a local is not a screen. Without the local-`var` exclusions each assignment
// below would be a state-sink match. Nothing the model wrote is returned.
import OpenAI

struct SpeechLog {
    let openAI = OpenAI(apiToken: "token")

    func measure(_ query: AudioSpeechQuery) async throws -> Int {
        var speech = Data()
        let result = try await openAI.audioCreateSpeech(query: query)
        speech = result.audio
        print(speech.count)
        return 1
    }

    func measureTyped(_ query: AudioSpeechQuery) async throws -> Int {
        var narration: Data = Data()
        let result = try await openAI.audioCreateSpeech(query: query)
        narration = result.audio
        print(narration.count)
        return 1
    }
}
