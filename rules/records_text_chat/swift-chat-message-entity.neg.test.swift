// lexcode-expect: 0
import Foundation
import SwiftData
import Fluent

// Stored records that hold no chat text: a contact form, a support ticket, a chat ROOM (a name and
// members), a caption transcript and an inbox Message. A form the app only saves is not a chat.
// A chat message kept only in memory (a plain struct with no store) stores nothing.
@Model
final class ContactMessage {
    var email: String = ""
    var body: String = ""
}

@Model
final class SupportTicket {
    var subject: String = ""
}

final class ChatRoom: Model {
    static let schema = "chat_rooms"
    @ID(key: .id) var id: UUID?
    @Field(key: "name") var name: String
    init() {}
}

struct CreateRooms: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("chat_rooms").id().field("name", .string).create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("chat_rooms").delete()
    }
}

@Model
final class Transcript {
    var lectureCaptions: String = ""
}

struct ChatMessageDraft {
    var text: String
}
