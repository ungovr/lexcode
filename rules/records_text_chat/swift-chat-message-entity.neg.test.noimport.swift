// lexcode-expect: 0
import Foundation

// The app's own `Model` macro, `NSManagedObject`, `Object` and `Model` protocol in a file that imports
// none of SwiftData, Core Data, Realm or Fluent: these chat-named types are not mapped to any store.
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
