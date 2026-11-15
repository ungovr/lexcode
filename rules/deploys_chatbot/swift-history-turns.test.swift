// lexcode-expect: 5
import SwiftUI
import OpenAI
import SwiftOpenAI
import FoundationModels
import FirebaseAI

// A chat screen's model: each turn appends what the person typed, asks the model, and appends the
// reply to the same transcript, so the exchange goes on turn after turn.
@Observable
final class AssistantChatModel {
    var messages: [ChatQuery.ChatCompletionMessageParam] = []
    var history: [ChatCompletionParameters.Message] = []
    var bubbles: [Bubble] = []
    var turns: [Bubble] = []
    let openAI = OpenAI(apiToken: "sk-test")
    let service = OpenAIServiceFactory.service(apiKey: "sk-test")
    private let session = LanguageModelSession(instructions: "You are a helpful support assistant.")
    private let chat = FirebaseAI.firebaseAI(backend: .googleAI())
        .generativeModel(modelName: "gemini-2.5-flash")
        .startChat()

    func sendOpenAI(_ input: String) async throws {
        messages.append(.init(role: .user, content: input)!)
        let result = try await openAI.chats(query: ChatQuery(messages: messages, model: .gpt4_o))
        messages.append(.init(role: .assistant, content: result.choices.first?.message.content ?? "")!)
    }

    func sendSwiftOpenAI(_ input: String) async throws {
        history.append(.init(role: .user, content: .text(input)))
        let parameters = ChatCompletionParameters(messages: history, model: .gpt4o)
        let completion = try await service.startChat(parameters: parameters)
        history.append(.init(role: .assistant, content: .text(completion.choices?.first?.message?.content ?? "")))
    }

    func sendOnDevice(_ input: String) async throws {
        bubbles.append(Bubble(role: .user, text: input))
        let response = try await session.respond(to: input)
        bubbles.append(Bubble(role: .assistant, text: response.content))
    }

    func sendGemini(_ input: String) async throws {
        turns.append(Bubble(isUser: true, text: input))
        let response = try await chat.sendMessage(input)
        turns.append(Bubble(isUser: false, text: response.text ?? ""))
    }

    func sendStreamed(_ input: String) async throws {
        messages += [.init(role: .user, content: input)!]
        var reply = ""
        for try await chunk in openAI.chatsStream(query: ChatQuery(messages: messages, model: .gpt4_o)) {
            reply += chunk.choices.first?.delta.content ?? ""
        }
        messages += [.init(role: .assistant, content: reply)!]
    }
}
