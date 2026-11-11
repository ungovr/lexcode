// lexcode-expect: 6
package demo.socket

import io.ktor.server.routing.Route
import io.ktor.server.websocket.webSocket
import jakarta.websocket.OnMessage
import jakarta.websocket.Session
import jakarta.websocket.server.ServerEndpoint
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.handler.annotation.SendTo
import org.springframework.stereotype.Controller
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

// A socket handler that writes what a person typed to a message table before it relays it.
@Controller
class ChatSocket(
    private val messageRepository: MessageRepository,
    private val chatService: ChatService,
) {
    @MessageMapping("/chat.send")
    @SendTo("/topic/public")
    fun send(@Payload payload: ChatPayload): ChatPayload {
        messageRepository.save(Message(payload.sender, payload.content))
        return payload
    }

    @MessageMapping("/chat.private")
    suspend fun privateMessage(@Payload payload: ChatPayload) {
        chatService.save(payload)
    }
}

@ServerEndpoint("/chat/{room}")
class ChatEndpoint(private val chatLogRepository: ChatLogRepository) {
    @OnMessage
    fun onMessage(text: String, session: Session) {
        chatLogRepository.save(ChatLog(session.id, text))
    }
}

class ChatHandler(private val conversationStore: ConversationStore) : TextWebSocketHandler() {
    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        conversationStore.insert(session.id, message.payload)
    }
}

// Ktor: the frames of a socket route written to a message table, plain or through Exposed.
fun Route.chat(messageStore: MessageStore) {
    webSocket("/chat") {
        for (frame in incoming) {
            messageStore.save(frame)
        }
    }

    webSocket("/chat/exposed") {
        ChatMessages.insert { it[text] = "hello" }
    }
}
