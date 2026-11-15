// lexcode-expect: 0
// No Gemini SDK is imported, and no Firebase AI type is named. The app has its own GenerativeModel
// with generateContent and a chat with sendMessage, both reaching the screen, and a Firebase file that
// only uses Firestore.
import FirebaseFirestore
import SwiftUI

struct GenerativeModel {
    let name: String
    func generateContent(_ prompt: String) async throws -> String { prompt.reversed().map(String.init).joined() }
    func startChat() -> ChatThread { ChatThread() }
}

struct ChatThread {
    func sendMessage(_ text: String) async throws -> String { text }
}

@MainActor
final class LocalModel: ObservableObject {
    @Published var story = ""
    let model = GenerativeModel(name: "template")

    func write(_ prompt: String) async throws {
        let response = try await model.generateContent(prompt)
        story = response
    }

    func chat(_ line: String) async throws {
        let response = try await model.startChat().sendMessage(line)
        self.story = response
    }

    func load() async throws {
        let snapshot = try await Firestore.firestore().collection("stories").document("today").getDocument()
        story = snapshot.get("text") as? String ?? ""
    }
}
