// lexcode-expect: 9
import Foundation
import SwiftData
import CoreData
import Fluent
import Vapor
import RealmSwift
import FirebaseFirestore

// Each turn of a chat written to a store: SwiftData, Core Data, Fluent, Realm and Firestore, by a
// chat-named record, or by a message record that carries the speaker's role.
final class ChatStore {
    func keep(_ text: String, in context: ModelContext) throws {
        context.insert(ChatMessage(role: "user", text: text))
        context.insert(Message(role: .assistant, text: text))
        try context.save()
    }

    func keep(_ text: String, in moc: NSManagedObjectContext) throws {
        let turn = ConversationTurnMO(context: moc)
        turn.text = text
        let legacy = NSEntityDescription.insertNewObject(forEntityName: "ChatMessage", into: moc)
        legacy.setValue(text, forKey: "text")
        try moc.save()
    }

    func keep(_ text: String, on req: Request) async throws {
        let entry = ChatEntry(text: text)
        try await entry.save(on: req.db)
        try await Message(role: "assistant", content: text).create(on: req.db)
    }

    func keep(_ text: String, realm: Realm) throws {
        try realm.write {
            realm.add(ChatTranscript(text: text))
        }
    }

    func keep(_ text: String, chatID: String) async throws {
        let db = Firestore.firestore()
        try await db.collection("chats").document(chatID).collection("messages").addDocument(data: ["text": text])
        _ = try await db.collection("chat_messages").addDocument(data: ["text": text])
    }
}
