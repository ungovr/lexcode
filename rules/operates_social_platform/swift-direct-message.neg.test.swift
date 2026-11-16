// lexcode-expect: 0
// An email and a push notification with a sender and a recipient, a message to the app's support
// staff (the definition's exclusion: a comment for staff to read), a room message with no
// recipient, and sender and recipient locals in a function.
import Foundation

struct EmailMessage: Codable {
    let sender: String
    let recipient: String
}

struct PushNotificationMessage: Codable {
    let sender: String
    let recipient: String
}

struct SupportChatMessage: Codable {
    let author: String
    let recipient: String
}

struct ChatMessage: Codable {
    let sender: String
    let roomId: String
}

struct UserMessage {
    let body: String

    func forward() {
        let sender = "me"
        let recipient = "you"
        print(sender, recipient, body)
    }
}
