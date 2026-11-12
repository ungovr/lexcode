// lexcode-expect: 1
// A WebSocket send to one named user on a chat destination, through the Spring sending
// interface.
package demo.social

import org.springframework.messaging.simp.SimpMessageSendingOperations
import org.springframework.stereotype.Service

@Service
class OperationsMessenger(private val operations: SimpMessageSendingOperations) {
    fun send(user: String, text: String) {
        operations.convertAndSendToUser(user, "/queue/chat", text)
    }
}
