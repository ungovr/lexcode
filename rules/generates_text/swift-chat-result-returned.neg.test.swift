// lexcode-expect: 0
// Functions that return text, none of it from a model vendor: the app's own OpenAI and
// LanguageModelSession types (no vendor import), and text a person wrote that the app only formats.
import Foundation

struct OpenAI {
    func chats(query: String) async throws -> String { query }
}

struct LanguageModelSession {
    func respond(to prompt: String) async throws -> String { prompt }
}

struct Formatter {
    let openAI = OpenAI()
    let session = LanguageModelSession()

    func tidy(_ text: String) async throws -> String {
        let result = try await openAI.chats(query: text)
        return result.trimmingCharacters(in: .whitespaces)
    }

    func echo(_ text: String) async throws -> String {
        let response = try await session.respond(to: text)
        return response
    }

    func title(_ text: String) -> String {
        return text.capitalized
    }
}
