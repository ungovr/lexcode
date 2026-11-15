// lexcode-expect: 0
import Vapor
import OpenAI

struct SummaryBody: Content {
    var text: String
    var messages: [String]
}

// One-shot tools behind an endpoint: the request carries one text, and the server builds a fixed
// prompt around it. A single message from the request inside a fixed prompt is not a conversation.
// The last handler forwards the request's message list to the app's own moderation queue, not to a
// model.
struct ToolsController {
    let openAI = OpenAI(apiToken: "sk-test")

    func summarize(req: Request) async throws -> String {
        let body = try req.content.decode(SummaryBody.self)
        let result = try await openAI.chats(query: ChatQuery(messages: [
            .init(role: .system, content: "Summarize the text.")!,
            .init(role: .user, content: body.text)!,
        ], model: .gpt4_o))
        return result.choices.first?.message.content ?? ""
    }

    func moderate(req: Request) async throws -> HTTPStatus {
        let body = try req.content.decode(SummaryBody.self)
        try await moderationQueue.enqueue(messages: body.messages)
        return .accepted
    }
}
