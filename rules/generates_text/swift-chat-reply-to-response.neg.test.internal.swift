// lexcode-expect: 0
// The model is real, but its text never reaches the app's users: it is logged for the team, written to
// an internal file, kept in a local variable that is never shown, and used only to pick a category. The
// definition leaves out a tool whose output only its own team reads.
import Foundation
import OpenAI
import os

final class TicketTriage {
    let openAI = OpenAI(apiToken: "token")
    let logger = Logger(subsystem: "com.example.triage", category: "model")
    var category = 0

    func triage(_ query: ChatQuery) async throws {
        let result = try await openAI.chats(query: query)
        logger.info("triage reply: \(result.choices.first?.message.content ?? "", privacy: .private)")
        print(result.usage as Any)
    }

    func archive(_ query: ChatQuery, to url: URL) async throws {
        let result = try await openAI.chats(query: query)
        let data = Data((result.choices.first?.message.content ?? "").utf8)
        try data.write(to: url)
    }

    func measure(_ query: ChatQuery) async throws {
        var draft = ""
        for try await chunk in openAI.chatsStream(query: query) {
            draft += chunk.choices.first?.delta.content ?? ""
        }
        logger.debug("draft length \(draft.count)")
    }

    func classify(_ query: ChatQuery) async throws {
        let result = try await openAI.chats(query: query)
        let label = result.choices.first?.message.content ?? ""
        category = label.hasPrefix("billing") ? 1 : 2
    }
}
