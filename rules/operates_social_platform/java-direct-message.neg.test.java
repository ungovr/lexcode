// lexcode-expect: 0
// Not a message from one user account to another: an email envelope, a notification pushed to a
// user, a contact form for staff to read, a broker event, and a chat DTO with no recipient.
package demo.social;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Entity
class EmailMessage {
  @Id
  Long id;
  String sender;
  String recipient;
  String subject;
}

@Entity
class NotificationMessage {
  @Id
  Long id;
  String sender;
  String recipient;
  String text;
}

@Entity
class ContactMessage {
  @Id
  Long id;
  String sender;
  String body;
}

class EventMessage {
  String sender;
  String receiver;
  String payload;
}

class ChatMessage {
  String sender;
  String content;
}

class Notifier {
  SimpMessagingTemplate template;

  void notifyUser(String user, String text) {
    template.convertAndSendToUser(user, "/queue/notifications", text);
    template.convertAndSend("/topic/status", text);
    template.convertAndSendToUser(user, "/queue/admin-alerts", text);
    template.convertAndSendToUser(user, "/queue/admin", text);
  }
}
