// lexcode-expect: 5
import Vapor
import Hummingbird
import OpenAI
import SwiftOpenAI

struct ChatBody: Content {
    var messages: [ChatQuery.ChatCompletionMessageParam]
}

// A server-side chat endpoint: the app sends the whole conversation so far, and the server hands it
// to a language model and returns the reply.
struct ChatController {
    let openAI = OpenAI(apiToken: "sk-test")
    let service = OpenAIServiceFactory.service(apiKey: "sk-test")

    func chat(req: Request) async throws -> String {
        let body = try req.content.decode(ChatBody.self)
        let result = try await openAI.chats(query: ChatQuery(messages: body.messages, model: .gpt4_o))
        return result.choices.first?.message.content ?? ""
    }

    func chatArray(req: Request) async throws -> String {
        let history = try req.content.decode([ChatQuery.ChatCompletionMessageParam].self)
        let result = try await openAI.chats(query: .init(messages: history, model: .gpt4_o))
        return result.choices.first?.message.content ?? ""
    }

    func chatStreamed(req: Request) async throws -> Response {
        let body = try req.content.decode(ChatBody.self)
        let stream: AsyncThrowingStream<ChatStreamResult, Error> = openAI.chatsStream(
            query: ChatQuery(messages: body.messages, model: .gpt4_o)
        )
        return Response(body: .init(asyncStream: { _ in _ = stream }))
    }

    func chatSwiftOpenAI(req: Request) async throws -> String {
        let body = try req.content.decode(SwiftChatBody.self)
        let completion = try await service.startChat(
            parameters: ChatCompletionParameters(messages: body.conversation.map { $0.asMessage }, model: .gpt4o)
        )
        return completion.choices?.first?.message?.content ?? ""
    }

    func chatHummingbird(request: Request, context: some RequestContext) async throws -> String {
        let body = try await request.decode(as: ChatBody.self, context: context)
        let result = try await openAI.chats(query: ChatQuery(messages: body.messages, model: .gpt4_o))
        return result.choices.first?.message.content ?? ""
    }
}
