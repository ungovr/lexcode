// lexcode-expect: 5
// Vapor and Hummingbird route handlers and closures of one expression, whose value is the implicit
// return: the model's text is the response.
import Hummingbird
import OpenAI
import Vapor

func routes(_ app: Application, openAI: OpenAI) throws {
    app.post("draft") { req async throws -> String in
        try await openAI.chats(query: req.content.decode(ChatQuery.self)).choices.first?.message.content ?? ""
    }

    app.get("hello") { req in
        try await openAI.chats(query: ChatQuery(messages: [.user(.init(content: .string("hi")))], model: .gpt4_o))
            .choices.first?.message.content ?? ""
    }
}

func hummingbird(_ router: Router<BasicRequestContext>, openAI: OpenAI) {
    router.post("ask") { request, context in
        try await openAI.chats(query: request.decode(as: ChatQuery.self, context: context)).choices.first?.message.content ?? ""
    }
}

struct AskController: RouteCollection {
    let openAI: OpenAI

    func boot(routes: RoutesBuilder) throws {
        routes.post("ask", use: ask)
        routes.get("title", use: title)
    }

    func ask(req: Request) async throws -> String {
        try await openAI.chats(query: req.content.decode(ChatQuery.self)).choices.first?.message.content ?? ""
    }

    func title(_ req: Request) async throws -> String {
        try await openAI
            .chats(query: ChatQuery(messages: [], model: .gpt4_o))
            .choices.first?.message.content ?? ""
    }
}
