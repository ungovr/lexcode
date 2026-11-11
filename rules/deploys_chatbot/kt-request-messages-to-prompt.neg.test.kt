// lexcode-expect: 0
package demo.ai

import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class PromptTools(
    private val chatModel: ChatModel,
    private val archive: ArchiveService,
    private val templates: MailTemplates,
) {
    // A request object whose single field fills a fixed prompt: still one question, one answer.
    @PostMapping("/title")
    fun title(@RequestBody request: TitleRequest): String =
        chatModel.call(Prompt(UserMessage("Suggest a title for: " + request.body))).result.output.text

    // Messages that come from the app's own store, not from the request.
    @PostMapping("/replay")
    fun replay(@RequestBody request: ReplayRequest) = chatModel.call(Prompt(archive.messages))

    // The request's own value goes to the model, but it is not a conversation: its property is named
    // for something else, or the whole body is one string.
    @PostMapping("/options")
    fun options(@RequestBody request: OptionsRequest, @RequestBody note: String) {
        chatModel.call(Prompt(request.options))
        chatModel.call(Prompt(note))
        chatModel.chat(request.options)
        chatModel.chat(note)
        chatModel.generate(request.options)
        chatModel.generate(note)
        chatModel.summarize(request.options)
        chatModel.summarize(note)
    }

    // chat() and generate() on a receiver that is not a model: the request's messages go to the mail templates.
    @PostMapping("/relay")
    fun relay(@RequestBody request: ChatRequest, @RequestBody messages: List<String>) {
        templates.chat(request.messages)
        templates.chat(messages)
        templates.generate(request.messages)
        templates.generate(messages)
    }
}

// A job that builds its own messages and calls the model: no client conversation.
class NightlyPrompts(private val chatModel: ChatModel) {
    fun classify(history: List<org.springframework.ai.chat.messages.Message>) = chatModel.call(Prompt(history))

    suspend fun classifyFromQueue(queue: Queue) {
        val request = queue.receive<ClassifyRequest>()
        chatModel.call(Prompt(request.messages))
    }
}
