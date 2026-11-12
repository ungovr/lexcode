// lexcode-expect: 8
package demo.ai

import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.api.chat.ChatMessage
import com.aallam.openai.api.chat.ChatRole
import com.aallam.openai.api.model.ModelId
import com.aallam.openai.client.OpenAI
import com.anthropic.client.AnthropicClient
import com.anthropic.models.messages.MessageCreateParams
import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import dev.langchain4j.data.message.UserMessage
import dev.langchain4j.model.chat.ChatLanguageModel
import org.springframework.ai.chat.messages.Message
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.prompt.Prompt

// Each turn pushes the user's message onto a running history, sends the history to a model and
// stores the reply back in it.
class Conversations(
    private val chatModel: ChatModel,
    private val langchain: ChatLanguageModel,
    private val openai: OpenAIClient,
    private val anthropic: AnthropicClient,
    private val aallam: OpenAI,
) {
    fun springAiRepl() {
        val history = mutableListOf<Message>()
        while (true) {
            history.add(org.springframework.ai.chat.messages.UserMessage(readln()))
            val response = chatModel.call(Prompt(history))
            history.add(response.result.output)
        }
    }

    fun springAiOperators(question: String) {
        val history = mutableListOf<Message>()
        history += org.springframework.ai.chat.messages.UserMessage(question)
        val response = chatModel.call(Prompt(history))
        history += response.result.output
    }

    fun langchain4jTurn(history: MutableList<dev.langchain4j.data.message.ChatMessage>, question: String) {
        history.add(UserMessage.from(question))
        val reply = langchain.chat(history)
        history.add(reply.aiMessage())
    }

    fun openAiTurn(params: ChatCompletionCreateParams.Builder, question: String) {
        params.addUserMessage(question)
        val completion = openai.chat().completions().create(params.build())
        params.addMessage(completion.choices().first().message())
    }

    fun anthropicTurn(params: MessageCreateParams.Builder, question: String) {
        params.addUserMessage(question)
        val message = anthropic.messages().create(params.build())
        params.addAssistantMessage(message.content().first().text().get().text())
    }

    fun roleStrings(history: MutableList<dev.langchain4j.data.message.ChatMessage>, question: String) {
        history.add(newTurn("user", question))
        val created = openai.chat().completions().create(ChatCompletionCreateParams.builder().model("m").messages(history).build())
        history.add(newTurn("assistant", created.choices().first().message().content().orElse("")))
    }

    suspend fun aallamTurn(history: MutableList<ChatMessage>, question: String) {
        history.add(ChatMessage(role = ChatRole.User, content = question))
        val completion = aallam.chatCompletion(ChatCompletionRequest(model = ModelId("gpt-4o"), messages = history))
        history.add(completion.choices.first().message)
    }

    suspend fun aallamOperators(history: MutableList<ChatMessage>, question: String) {
        history += ChatMessage(role = ChatRole.User, content = question)
        val completion = aallam.chatCompletion(ChatCompletionRequest(model = ModelId("gpt-4o"), messages = history))
        history += completion.choices.first().message
    }

    private fun newTurn(role: String, text: String): dev.langchain4j.data.message.ChatMessage? = null
}
