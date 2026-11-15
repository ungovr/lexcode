// lexcode-expect: 0
import Foundation

// The app's own `Model` protocol, `NSManagedObject`, `Object` and `PersistableRecord`, and a `@Model`
// attribute from the app's own macro module, in a file that imports none of SwiftData, Core Data,
// Realm, Fluent or GRDB: these chat-named types are not mapped to any store.
protocol Model {}

protocol PersistableRecord {}

class NSManagedObject {}

class Object {}

@Model
final class ChatMessage {
    var text: String = ""
}

final class ChatHistory: NSManagedObject {
    var text: String = ""
}

final class ChatTurn: Object {
    var text: String = ""
}

final class ChatEntry: Model {
    static let schema = "chat_entries"
}

struct ChatLogRecord: PersistableRecord {
    var text: String
}
