// lexcode-expect: 10
package demo.ai

import com.google.cloud.vertexai.generativeai.GenerativeModel
import dev.langchain4j.memory.chat.MessageWindowChatMemory
import dev.langchain4j.memory.chat.TokenWindowChatMemory
import dev.langchain4j.service.AiServices
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor
import org.springframework.ai.chat.client.advisor.PromptChatMemoryAdvisor
import org.springframework.ai.chat.client.advisor.vectorstore.VectorStoreChatMemoryAdvisor

// Code that keeps the earlier turns of a conversation with a language model, so the next answer
// follows the last one; the code does not show who the conversation is with.
class Remembering {
    interface Assistant {
        fun chat(message: String): String
    }

    fun windowed(model: dev.langchain4j.model.chat.ChatLanguageModel): Assistant =
        AiServices.builder(Assistant::class.java)
            .chatLanguageModel(model)
            .chatMemory(MessageWindowChatMemory.withMaxMessages(20))
            .build()

    fun perUser(model: dev.langchain4j.model.chat.ChatLanguageModel): Assistant =
        AiServices.builder(Assistant::class.java)
            .chatLanguageModel(model)
            .chatMemoryProvider { id -> CustomMemory(id) }
            .build()

    fun perUserCall(model: dev.langchain4j.model.chat.ChatLanguageModel): Assistant =
        AiServices.builder(Assistant::class.java)
            .chatLanguageModel(model)
            .chatMemoryProvider(MemoryProviderFactory.create())
            .build()

    fun standalone() = TokenWindowChatMemory.withMaxTokens(1000, null)

    fun springAdvisors(builder: org.springframework.ai.chat.client.ChatClient.Builder,
                       memory: org.springframework.ai.chat.memory.ChatMemory): Any {
        builder.defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build())
        builder.defaultAdvisors(PromptChatMemoryAdvisor.builder(memory).build())
        builder.defaultAdvisors(VectorStoreChatMemoryAdvisor.builder(null).build())
        return builder.build()
    }

    fun springCtor(memory: org.springframework.ai.chat.memory.ChatMemory) = MessageChatMemoryAdvisor(memory)

    fun genAiSession(genAiClient: com.google.genai.Client) = genAiClient.chats.create("gemini-2.0-flash")

    fun geminiSession(model: GenerativeModel) = model.startChat().sendMessage("Hello")
}
