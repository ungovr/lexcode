// lexcode-expect: 0
import Foundation
import OpenAI

// Text to speech reads typed text aloud: the definition leaves typed text out, even when the
// app reads it aloud. The chat call sends text, not audio.
final class ReadAloud {
    private let openAI = OpenAI(apiToken: "sk-test")

    func speak(_ typed: String) async throws -> Data {
        let query = AudioSpeechQuery(model: .tts_1, input: typed, voice: .alloy, responseFormat: .mp3, speed: 1.0)
        return try await openAI.audioCreateSpeech(query: query).audio
    }

    func reply(_ typed: String) async throws {
        let query = ChatQuery(messages: [.user(.init(content: .string(typed)))], model: .gpt4_o)
        _ = try await openAI.chats(query: query)
    }

    let speechEndpoint = URL(string: "https://api.openai.com/v1/audio/speech")!
    let elevenLabsVoice = URL(string: "https://api.elevenlabs.io/v1/text-to-speech/voice-1")!
}
