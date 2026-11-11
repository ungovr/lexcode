// lexcode-expect: 0
// Not a message from one user account to another: mail and notification classes with a sender and
// a recipient, a message to staff, an event message, a chat message with no recipient, a
// message class holding only a sender or only a recipient (constructor and body forms), a sender
// local inside a method, a WebSocket send to a user through a template this file never imports from Spring (the next
// fixture covers sends to a user on a notification or admin destination).
package demo.social

import jakarta.persistence.Entity
import jakarta.persistence.Id

@Entity
data class EmailMessage(@Id val id: Long, val sender: String, val recipient: String, val body: String)

data class NotificationMessage(val sender: String, val receiver: String, val text: String)

data class ContactMessage(val fromUser: String, val toUser: String)

class EventMessage {
    var sender: String = ""
    var receiver: String = ""
}

data class EmailChatMessage(val sender: String, val recipient: String)

data class AuditUserMessage(val fromUser: String, val toUser: String)

class Dm {
    var recipient: String = ""

    fun reply(): String {
        val sender: String = "me"
        return sender
    }

    fun quote() {
        val sender: String = "me"
        println(sender)
    }

    fun first() = run {
        val sender: String = "me"
        sender
    }
}

data class UserMessage(val recipient: String, val body: String)

data class PrivateMessage(val sender: String, val body: String)

class InboxMessage {
    var sender: String = ""
    var body: String = ""
}

class DirectMessage {
    var recipient: String = ""
    var body: String = ""
}

data class ChatMessage(@Id val id: Long, val sender: String, val body: String)

class Gateway {
    fun notifyUser(template: Notifier, user: String, text: String) {
        template.convertAndSendToUser(user, "/queue/notifications", text)
    }

    fun deliver(notifier: Notifier, user: String, text: String) {
        notifier.convertAndSendToUser(user, "/queue/messages", text)
    }
}

interface Notifier {
    fun convertAndSendToUser(user: String, destination: String, payload: Any)
}
