// lexcode-expect: 6
// Direct messages between user accounts: classes with a sender and a recipient (in the
// constructor or the body), and a Spring WebSocket send to one named user on a message
// destination.
package demo.social

import jakarta.persistence.Entity
import jakarta.persistence.Id
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Entity
data class DirectMessage(@Id val id: Long, val senderId: Long, val recipientId: Long, val body: String)

data class PrivateMessage(val toUser: String, var fromUser: String, val text: String)

@Entity
class InboxMessage {
    @Id
    var id: Long = 0
    var sender: String = ""
    var receiver: String = ""
}

class Dm(val id: Long) {
    lateinit var author: String
    var recipient: String? = null
}

@Service
class Messenger(private val template: SimpMessagingTemplate) {
    fun send(user: String, text: String) {
        template.convertAndSendToUser(user, "/queue/messages", text)
        template.convertAndSendToUser(user, "/queue/dm", text)
    }
}
