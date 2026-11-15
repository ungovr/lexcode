// lexcode-expect: 3
import Foundation
import Fluent
import SwiftData

// A client model of a direct message from the app's own service.
struct DirectMessage: Codable, Identifiable {
    let id: UUID
    let sender: String
    let recipient: String
    let text: String
}

// A Fluent model of a private message between two accounts.
final class PrivateMessageModel: Model {
    static let schema = "private_messages"
    @ID(key: .id) var id: UUID?
    @Parent(key: "sender_id") var sender: User
    @Parent(key: "recipient_id") var recipient: User

    init() {}
}

// A SwiftData inbox message with ids and a default.
@Model
final class InboxMessage {
    var senderID: UUID
    var receiverID: UUID
    var read: Bool = false

    init(senderID: UUID, receiverID: UUID) {
        self.senderID = senderID
        self.receiverID = receiverID
    }
}
