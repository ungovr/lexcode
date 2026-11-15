// lexcode-expect: 0
import Foundation
import OpenAI
import FoundationModels

// One-shot tools, not a conversation: a prompt built in steps and sent once, few-shot examples
// appended before the call, and a single summary request whose result is shown once. None of them
// keeps a running exchange with the person: no reply is appended to the history after the call.
final class ArticleTools {
    let openAI = OpenAI(apiToken: "sk-test")
    let session = LanguageModelSession(instructions: "Summarize articles.")
    var shown: [String] = []

    func summarize(_ article: String) async throws -> String {
        var messages: [ChatQuery.ChatCompletionMessageParam] = []
        messages.append(.init(role: .system, content: "You summarize articles.")!)
        messages.append(.init(role: .user, content: article)!)
        let result = try await openAI.chats(query: ChatQuery(messages: messages, model: .gpt4_o))
        return result.choices.first?.message.content ?? ""
    }

    func classify(_ text: String) async throws -> String {
        var examples: [ChatQuery.ChatCompletionMessageParam] = []
        examples.append(.init(role: .user, content: "I love it")!)
        examples.append(.init(role: .assistant, content: "positive")!)
        examples.append(.init(role: .user, content: text)!)
        let result = try await openAI.chats(query: ChatQuery(messages: examples, model: .gpt4_o))
        return result.choices.first?.message.content ?? ""
    }

    func caption(_ text: String) async throws {
        let response = try await session.respond(to: "Write a caption for: \(text)")
        shown.append(response.content)
    }
}
