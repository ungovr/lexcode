// lexcode-expect: 1
// A WebSocket send to one named user on a message destination, with the Spring messaging
// package imported by wildcard.
package demo.social

import org.springframework.messaging.simp.*
import org.springframework.stereotype.Service

@Service
class WildcardMessenger(private val sender: SimpMessagingTemplate) {
    fun send(user: String, text: String) {
        sender.convertAndSendToUser(user, "/queue/private", text)
    }
}
