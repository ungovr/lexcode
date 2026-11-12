// lexcode-expect: 0
package demo.ai

import dev.langchain4j.data.message.ChatMessage
import dev.langchain4j.model.chat.ChatLanguageModel
import dev.langchain4j.service.AiServices
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.chat.model.ChatModel

class Stateless {
    interface Summarizer {
        fun summarize(text: String): String
    }

    // An AI service with no memory: every call stands alone.
    fun summarizer(model: ChatLanguageModel): Summarizer =
        AiServices.builder(Summarizer::class.java).chatLanguageModel(model).build()

    // A Spring AI client with a system line and nothing that keeps earlier turns.
    fun client(model: ChatModel): ChatClient =
        ChatClient.builder(model).defaultSystem("Answer in one sentence.").build()

    // Messages collected in a list for a single request.
    fun oneRequest(question: ChatMessage): List<ChatMessage> {
        val messages = mutableListOf<ChatMessage>()
        messages.add(question)
        return messages
    }

    // Memory that is not a chat's: a JVM heap reading and a cache sized in megabytes.
    fun headroom(runtime: Runtime, memoryCache: MemoryCache): Long {
        memoryCache.resize(64)
        return runtime.freeMemory()
    }

    // Names that only look like the chat calls: a text-field chat and a lookalike session factory.
    fun lookalikes(sessions: SessionFactory, store: MemoryStore, chatRepository: RoomDatabase) {
        sessions.create("chats")
        store.chats.size
        store.startChatter()
        chatRepository.chats.create(RoomRow("general"))
    }
}
