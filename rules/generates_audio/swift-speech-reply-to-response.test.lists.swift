// lexcode-expect: 2
// A view model whose list of speech clips is named for results or outputs.
import OpenAI
import SwiftUI

@MainActor
final class NarrationModel: ObservableObject {
    let openAI = OpenAI(apiToken: "token")
    @Published var results: [Data] = []
    @Published var outputs: [Data] = []

    func speak(_ query: AudioSpeechQuery) async throws {
        let result = try await openAI.audioCreateSpeech(query: query)
        results.append(result.audio)
    }

    func again(_ query: AudioSpeechQuery) async throws {
        let result = try await openAI.audioCreateSpeech(query: query)
        outputs = [result.audio]
    }
}
