// lexcode-expect: 0
package demo.chat.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.mongodb.core.mapping.Document

// Stored records that are not chat text, and a chat message class that is never stored.

// A form the app only saves: a contact message is a form submission, not a chat.
@Entity(tableName = "contact_message")
data class ContactMessage(
    @PrimaryKey val id: Long,
    val email: String,
    val body: String,
)

// A room has a name and members; the text lives somewhere else, or nowhere.
@Entity
class ChatRoom {
    @Id
    var id: Long = 0
    var name: String = ""
}

@Document("chat_settings")
data class ChatSettings(val roomId: String, val muted: Boolean)

// A transfer object for the wire, with no persistence annotation: nothing is kept by this class.
data class ChatMessage(val sender: String, val text: String)

// A support ticket is a form.
@Entity
data class SupportTicket(@PrimaryKey val id: Long, val subject: String)

// An academic transcript: courses and grades, not chat text.
@Entity
@Table(name = "TRANSCRIPT")
class Transcript(@Id val id: Long, val studentId: String)

@Entity
class TranscriptEntry(@Id val id: Long, val course: String, val grade: String)

// A caption line of a recorded lecture.
@Entity
class TranscriptLine(@Id val id: Long, val caption: String)

// A bare conversation record: who talked and when.
@Entity
class Conversation(@Id val id: Long, val topic: String)

// An inbox message of a learning platform is mail between people, not a chat; the bare name is not enough.
@Entity(tableName = "message")
data class Message(@PrimaryKey val id: Long, val subject: String)
