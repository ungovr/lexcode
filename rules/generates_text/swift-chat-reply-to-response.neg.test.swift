// lexcode-expect: 0
// No model vendor is imported. The app has its own types named like the vendors' (OpenAI,
// LanguageModelSession, a service with startChat), and each one's text reaches a screen or a response,
// so a rule that matched the bare method names would fire. The rest is text a person wrote, which the
// app only formats or spell-checks: the definition's exclusion.
import SwiftUI
import UIKit
import Vapor

struct OpenAI {
    let apiToken: String
    func chats(query: String) async throws -> String { query.uppercased() }
}

final class LanguageModelSession {
    func respond(to prompt: String) async throws -> String { prompt }
    func streamResponse(to prompt: String) -> [String] { [prompt] }
}

struct SupportService {
    func startChat(parameters: String) async throws -> String { "Thanks, \(parameters)" }
}

@MainActor
final class NotesModel: ObservableObject {
    @Published var answer = ""
    @Published var messages: [String] = []
    let openAI = OpenAI(apiToken: "local")
    let session = LanguageModelSession()
    let support = SupportService()

    func echo(_ text: String) async throws {
        let result = try await openAI.chats(query: text)
        answer = result
    }

    func local(_ text: String) async throws {
        let response = try await session.respond(to: text)
        messages.append(response)
        for part in session.streamResponse(to: text) {
            answer += part
        }
    }

    func ticket(_ text: String) async throws {
        let reply = try await support.startChat(parameters: text)
        self.answer = reply
    }

    func spellChecked(_ draft: String, label: UILabel) {
        let checker = UITextChecker()
        let range = checker.rangeOfMisspelledWord(in: draft, range: NSRange(location: 0, length: draft.utf16.count), startingAt: 0, wrap: false, language: "en")
        label.text = range.location == NSNotFound ? draft : draft.capitalized
    }
}

struct NoteView: View {
    let note: String
    var body: some View {
        Text(note.trimmingCharacters(in: .whitespaces))
    }
}

func routes(_ app: Application) throws {
    app.post("notes") { req async throws -> String in
        let note = try req.content.decode(String.self)
        return note.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
