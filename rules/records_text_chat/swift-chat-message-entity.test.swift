// lexcode-expect: 11
import Foundation
import SwiftData
import CoreData
import Fluent
import FluentKit
import Vapor
import RealmSwift
import GRDB

// Chat messages mapped to a store: a SwiftData model, a Core Data managed object, a Fluent model and
// its migration, a Realm object and a GRDB record, each named for a chat message or a conversation
// turn.
@Model
final class ChatMessage {
    var role: String
    var text: String
    var sentAt: Date

    init(role: String, text: String, sentAt: Date = .now) {
        self.role = role
        self.text = text
        self.sentAt = sentAt
    }
}

@objc(ConversationTurnMO)
final class ConversationTurnMO: NSManagedObject {
    @NSManaged var text: String
    @NSManaged var isFromUser: Bool
}

final class ChatEntry: Content, Model {
    static let schema = "chat_entries"

    @ID(key: .id) var id: UUID?
    @Field(key: "text") var text: String

    init() {}
}

struct CreateChatMessages: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("chat_messages")
            .id()
            .field("text", .string, .required)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("chat_messages").delete()
    }
}

final class ChatTranscript: Object {
    @Persisted var text: String = ""
}

struct ChatLogRecord: Codable, FetchableRecord, PersistableRecord {
    var id: Int64?
    var text: String
}

final class ConversationEntry: Model {
    static let schema = "conversation_entries"
}

struct ChatTurnRecord: Codable, FetchableRecord, Identifiable, PersistableRecord {
    var id: Int64?
    var text: String
}

struct ChatHistoryRow: MutablePersistableRecord {
    var id: Int64?
}

final class ChatMessageRow: Record {
    var text: String = ""
}
