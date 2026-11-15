// lexcode-expect: 0
import SwiftUI
import Firebase

// A person-to-person messaging app on the Firebase umbrella (Auth and Firestore), with no Gemini
// model in the file: its own `startChat(with:)` opens a chat with a friend, and its own
// `sendMessage` posts what this person typed, with an automatic "delivered" bubble after it.
@Observable
final class FriendsChatModel {
    var bubbles: [Bubble] = []
    let coordinator = ChatCoordinator()
    let chatService = FriendChatService()

    func open(_ friend: Friend) {
        coordinator.startChat(with: friend)
    }

    func send(_ text: String) async throws {
        bubbles.append(Bubble(role: .user, text: text))
        try await chatService.sendMessage(text)
        bubbles.append(Bubble(role: .system, text: "Delivered"))
    }
}
