// lexcode-expect: 0
package demo.ai

import org.springframework.ai.chat.messages.Message
import org.springframework.ai.chat.messages.SystemMessage
import org.springframework.ai.chat.messages.UserMessage
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.prompt.Prompt

class OneShotTools(
    private val chatModel: ChatModel,
    private val audit: AuditTrail,
) {
    // A prompt built in steps and sent once: a system line plus a user line, nothing pushed after the call.
    fun answerOnce(question: String): String {
        val messages = mutableListOf<Message>()
        messages.add(SystemMessage("Answer in one sentence."))
        messages.add(UserMessage(question))
        return chatModel.call(Prompt(messages)).result.output.text
    }

    // The same, built with the plus-assign operator.
    fun answerOnceOperator(question: String): String {
        val messages = mutableListOf<Message>()
        messages += SystemMessage("Answer in one sentence.")
        messages += UserMessage(question)
        return chatModel.call(Prompt(messages)).result.output.text
    }

    // Few-shot examples: more user turns go in after the first call, but no model reply is stored back.
    fun classify(a: String, b: String): String {
        val shots = mutableListOf<Message>()
        shots.add(UserMessage(a))
        val first = chatModel.call(Prompt(shots)).result.output.text
        shots.add(UserMessage(b))
        shots += UserMessage("done")
        return first
    }

    // A batch job: each document gets its own fresh list, and the answers go to a separate result list.
    fun classifyAll(documents: List<String>): List<String> {
        val results = mutableListOf<String>()
        for (document in documents) {
            val one = mutableListOf<Message>()
            one.add(UserMessage(document))
            val label = chatModel.call(Prompt(one)).result.output.text
            results.add(label)
        }
        return results
    }

    // A list that names the current user and is rendered, not a conversation with a model: the word
    // "user" in an added value is not a user turn, and generate() here is a mail renderer.
    fun renderRecipients(currentUser: User, mailRenderer: MailRenderer) {
        val recipients = mutableListOf<String>()
        recipients.add(currentUser.email)
        mailRenderer.generate(recipients)
        recipients.add("audit@example.org")
        recipients += currentUser.backupEmail
    }

    // User messages collected for the audit trail, with no model call.
    fun record(text: String) {
        val trail = mutableListOf<Message>()
        trail.add(UserMessage(text))
        audit.saveAll(trail)
        trail.add(SystemMessage("recorded"))
    }
}
