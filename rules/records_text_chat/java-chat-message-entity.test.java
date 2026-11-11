// lexcode-expect: 4
package demo.chat.model;

import jakarta.persistence.Cacheable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.mongodb.core.mapping.Document;

// Classes that map what people typed in a chat to a table or a collection.
@Entity
@Table(name = "CHAT2_MESSAGE")
@Cacheable
public class ChatMessage {
    @Id
    private String id;
    @Column(name = "OWNER")
    private String owner;
    @Column(name = "BODY")
    private String body;
}

@Document(collection = "conversation_turns")
class ConversationTurn {
    private String conversationId;
    private String role;
    private String content;
}

@Entity
class LiveChatTranscript {
    @Id
    private Long id;
    private String text;
}

@Table("chat_log")
class SupportChatLog {
    private String sender;
    private String text;
}
