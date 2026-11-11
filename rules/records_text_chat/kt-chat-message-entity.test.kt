// lexcode-expect: 7
package demo.chat.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import jakarta.persistence.Column
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.mongodb.core.mapping.Document

// Classes that map what people typed in a chat to a table or a collection.
@Entity
@Table(name = "CHAT2_MESSAGE")
class ChatMessage {
    @Id
    var id: String = ""
    @Column(name = "OWNER")
    var owner: String = ""
    @Column(name = "BODY")
    var body: String = ""
}

@Document(collection = "conversation_turns")
data class ConversationTurn(
    val conversationId: String,
    val role: String,
    val content: String,
)

@Entity
class LiveChatTranscript(@Id val id: Long, val text: String)

@Table("chat_log")
class SupportChatLog {
    var sender: String = ""
    var text: String = ""
}

// A Room entity, the usual Android shape.
@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(name = "room_id") val roomId: String,
    val text: String,
    val sentAt: Long,
)

@Entity(tableName = "conversation_messages", indices = [])
data class ConversationMessage(
    @PrimaryKey val id: String,
    val body: String,
)

@Entity
data class AssistantChatHistory(@PrimaryKey val id: String, val turnsJson: String)
