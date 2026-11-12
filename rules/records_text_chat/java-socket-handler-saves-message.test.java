// lexcode-expect: 4
package demo.socket;

import jakarta.websocket.OnMessage;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

// A socket handler that writes what a person typed to a message table before it relays it.
@Controller
public class ChatSocket {
    private final MessageRepository messageRepository;
    private final ChatService chatService;

    public ChatSocket(MessageRepository messageRepository, ChatService chatService) {
        this.messageRepository = messageRepository;
        this.chatService = chatService;
    }

    @MessageMapping("/chat.send")
    @SendTo("/topic/public")
    public ChatPayload send(@Payload ChatPayload payload) {
        messageRepository.save(new Message(payload.getSender(), payload.getContent()));
        return payload;
    }

    @MessageMapping("/chat.private")
    public void privateMessage(@Payload ChatPayload payload) {
        chatService.save(payload);
    }
}

@ServerEndpoint("/chat/{room}")
class ChatEndpoint {
    private ChatLogRepository chatLogRepository;

    @OnMessage
    public void onMessage(String text, Session session) {
        chatLogRepository.save(new ChatLog(session.getId(), text));
    }

    @OnMessage
    public void onBinary(byte[] bytes, Session session) {
        chatLogRepository.saveAll(java.util.List.of(new ChatLog(session.getId(), new String(bytes))));
    }
}
