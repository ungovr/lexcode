// lexcode-expect: 4
// Messages addressed from one user account to another: stored direct and private messages, and
// a WebSocket handler that sends a message to one named user.
package demo.social;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Entity
class DirectMessage {
  @Id
  Long id;

  @ManyToOne
  private User sender;

  @ManyToOne
  private User recipient = null;

  String body;
}

@Entity
class PrivateMessage {
  @Id
  Long id;
  Long fromUserId;
  Long toUserId;
  String body;
}

class User {
}

class ChatController {
  SimpMessagingTemplate template;

  @MessageMapping("/chat.private")
  void send(String to, String text) {
    template.convertAndSendToUser(to, "/queue/messages", text);
  }

  void direct(String to, String text) {
    template.convertAndSendToUser(to, "/queue/dm", text);
  }
}
