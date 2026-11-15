// lexcode-expect: 0
import Foundation
import SwiftData
import CoreData
import Fluent
import Vapor
import RealmSwift
import FirebaseFirestore

// Saved records that are not a chat: a contact form, a feedback note, a chat ROOM with no text, an
// inbox Message between people (no speaker role), an in-memory list of chat bubbles, and Firestore
// documents in collections that hold no chat text.
final class FormStore {
    var bubbles: [ChatMessage] = []

    func keep(_ text: String, in context: ModelContext) throws {
        context.insert(ContactMessage(body: text))
        context.insert(Message(sender: currentUser, body: text))
        try context.save()
    }

    func keep(_ text: String, in moc: NSManagedObjectContext) throws {
        let note = FeedbackNote(context: moc)
        note.text = text
        let room = NSEntityDescription.insertNewObject(forEntityName: "ChatRoom", into: moc)
        room.setValue(text, forKey: "name")
        try moc.save()
    }

    func keep(_ text: String, on req: Request) async throws {
        let room = ChatRoom(name: text)
        try await room.save(on: req.db)
        bubbles.insert(ChatMessage(role: "user", text: text), at: 0)
    }

    func keep(_ text: String, realm: Realm) throws {
        try realm.write {
            realm.add(SupportTicket(subject: text))
        }
    }

    func keep(_ text: String) async throws {
        let db = Firestore.firestore()
        _ = try await db.collection("feedback").addDocument(data: ["text": text])
        _ = try await db.collection("users").document("u1").collection("messages_settings").addDocument(data: ["mute": true])
    }
}
