// lexcode-expect: 0
// An app's own `OpenAI` type (a wrapper over its in-house text service) beside a commented-out import of
// MacPaw's OpenAI package. A whole-file import guard reads import lines, never a comment, so neither the
// import in the comment below nor the `import OpenAI` in this header admits the app's own `chats(query:)`.
import Vapor
// import OpenAI
/* import OpenAI */

struct ChatQuery: Content {
    let text: String
}

struct ChatResult {
    struct Choice { struct Message { let content: String? }; let message: Message }
    let choices: [Choice]
}

final class OpenAI {
    func chats(query: ChatQuery) async throws -> ChatResult {
        ChatResult(choices: [.init(message: .init(content: query.text.uppercased()))])
    }
}

struct AskController: RouteCollection {
    let openAI: OpenAI

    func boot(routes: RoutesBuilder) throws {
        routes.post("ask", use: ask)
    }

    func ask(req: Request) async throws -> String {
        let query = try req.content.decode(ChatQuery.self)
        let result = try await openAI.chats(query: query)
        return result.choices.first?.message.content ?? ""
    }
}

struct WritingService {
    let openAI = OpenAI()

    func draft(_ query: ChatQuery) async throws -> String {
        let result = try await openAI.chats(query: query)
        return result.choices.first?.message.content ?? ""
    }
}
