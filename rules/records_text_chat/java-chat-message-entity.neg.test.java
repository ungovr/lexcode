// lexcode-expect: 0
package demo.chat.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.mongodb.core.mapping.Document;

// Stored records that are not chat text, and a chat message class that is never stored.

// A form the app only saves: a contact message is a form submission, not a chat.
@Entity
@Table(name = "CONTACT_MESSAGE")
class ContactMessage {
    @Id
    private Long id;
    private String email;
    private String body;
}

// A room has a name and members; the text lives somewhere else, or nowhere.
@Entity
class ChatRoom {
    @Id
    private Long id;
    private String name;
}

@Document("chat_settings")
class ChatSettings {
    private String roomId;
    private boolean muted;
}

// A transfer object for the wire, with no persistence annotation: nothing is kept by this class.
class ChatMessage {
    private String sender;
    private String text;
}

// A support ticket is a form.
@Entity
class SupportTicket {
    @Id
    private Long id;
    private String subject;
}

// An academic transcript: courses and grades, not chat text.
@Entity
@Table(name = "TRANSCRIPT")
class Transcript {
    @Id
    private Long id;
    private String studentId;
}

@Entity
class TranscriptEntry {
    @Id
    private Long id;
    private String course;
    private String grade;
}

// A caption line of a recorded lecture.
@Entity
class TranscriptLine {
    @Id
    private Long id;
    private String caption;
}

// A bare conversation record: who talked and when.
@Entity
class Conversation {
    @Id
    private Long id;
    private String topic;
}
