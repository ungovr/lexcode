// lexcode-expect: 2
import SwiftUI
import FirebaseAI

// A Gemini chat session, which keeps the earlier turns so each new message continues the exchange.
@Observable
final class HelpChat {
    private let model = FirebaseAI.firebaseAI(backend: .googleAI()).generativeModel(modelName: "gemini-2.5-flash")
    private lazy var chat = model.startChat()

    func restore(_ earlier: [ModelContent]) -> Chat {
        model.startChat(history: earlier)
    }

    func send(_ text: String) async throws -> String {
        let response = try await chat.sendMessage(text)
        return response.text ?? ""
    }
}
