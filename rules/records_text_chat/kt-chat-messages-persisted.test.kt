// lexcode-expect: 10
package demo.chat

import org.jetbrains.exposed.sql.insert
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

// What people typed in a chat, written to a table.
@RestController
class ChatController(
    private val chatMessageRepository: ChatMessageRepository,
    private val conversationMessageRepository: ConversationMessageRepository,
    private val chatTranscriptDao: ChatTranscriptDao,
    private val chatMessageDao: ChatMessageDao,
    private val database: AppDatabase,
    private val store: MessageStore,
    private val entityManager: javax.persistence.EntityManager,
) {
    @PostMapping("/chat/send")
    fun send(@RequestBody post: ChatPost) {
        chatMessageRepository.save(ChatMessage(post.room, post.user, post.text))
    }

    @PostMapping("/chat/import")
    fun importAll(@RequestBody messages: List<ChatMessage>) {
        conversationMessageRepository.saveAll(messages)
    }

    fun archive(entry: ChatTranscript) {
        chatTranscriptDao.insert(entry)
    }

    fun persistTurn(room: String, text: String) {
        entityManager.persist(ChatTurn(room, text))
    }

    fun builderTurn(room: String, text: String) {
        store.save(ConversationMessage.builder().room(room).text(text).build())
    }

    fun viaOtherName(room: String, text: String) {
        store.saveAndFlush(ConversationTurn(room, text))
    }

    fun direct(message: ChatMessage) {
        chatMessageRepository.saveAndFlush(message)
    }

    // Room: the DAO is named for the messages, directly or through the database object.
    suspend fun room(entity: ChatMessageEntity) {
        database.chatMessageDao().insert(entity)
        chatMessageDao.upsert(entity)
    }

    // Exposed: an insert into a table object named for the messages.
    fun exposed(text: String) {
        ChatMessages.insert { it[ChatMessages.text] = text }
    }
}
