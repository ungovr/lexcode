// lexcode-expect: 4
// A closure's or a Task's own return of the model's text, under a method with no return type and
// under an init. The two route closures are the evidence rule's response and are not counted here.
import OpenAI
import Vapor

final class Drafts {
    let openAI: OpenAI
    var task: Task<String, Error>?
    var loader: (() async throws -> String)?

    init(openAI: OpenAI, query: ChatQuery) {
        self.openAI = openAI
        task = Task {
            let result = try await openAI.chats(query: query)
            return result.choices.first?.message.content ?? ""
        }
    }

    func start(_ query: ChatQuery) {
        task = Task {
            let result = try await openAI.chats(query: query)
            return result.choices.first?.message.content ?? ""
        }
    }

    func startTyped(_ query: ChatQuery) {
        task = Task { () -> String in
            let result = try await self.openAI.chats(query: query)
            return result.choices.first?.message.content ?? ""
        }
    }

    func makeLoader(_ query: ChatQuery) {
        loader = {
            let result = try await self.openAI.chats(query: query)
            return result.choices.first?.message.content ?? ""
        }
    }
}

func routes(_ app: Application, openAI: OpenAI) throws {
    app.post("ask") { req in
        let result = try await openAI.chats(query: try req.content.decode(ChatQuery.self))
        return result.choices.first?.message.content ?? ""
    }
    app.get("title") { req, ctx in
        let result = try await openAI.chats(query: ChatQuery(messages: [], model: .gpt4_o))
        return result.choices.first?.message.content ?? ""
    }
}
