// lexcode-expect: 0
import Foundation
import SwiftOpenAI

// SwiftOpenAI's `startChat(parameters:)` is a single chat-completion request, not a session that
// keeps earlier turns, and this file has no Gemini SDK import. The prompt is fixed, so this is a
// one-shot summary.
final class Summarizer {
    let service = OpenAIServiceFactory.service(apiKey: "sk-test")

    func summarize(_ text: String) async throws -> String {
        let parameters = ChatCompletionParameters(messages: [.init(role: .user, content: .text("Summarize: \(text)"))], model: .gpt4o)
        let completion = try await service.startChat(parameters: parameters)
        return completion.choices?.first?.message?.content ?? ""
    }
}
