// lexcode-expect: 0
// Not a message between user accounts: Spring WebSocket sends to one named user on a
// notification, status or admin destination, with the Spring template imported.
package demo.social

import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service

@Service
class Alerts(private val template: SimpMessagingTemplate) {
    fun push(user: String, text: String) {
        template.convertAndSendToUser(user, "/queue/notifications", text)
        template.convertAndSendToUser(user, "/queue/admin-alerts", text)
        template.convertAndSendToUser(user, "/queue/admin", text)
        template.convertAndSendToUser(user, "/queue/status", text)
    }
}
