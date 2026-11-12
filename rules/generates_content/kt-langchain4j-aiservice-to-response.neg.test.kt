// lexcode-expect: 0
// AI Service output that stays with the team, factories that hand the service on, and retrieval.
package com.example.negative.content

import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.service.AiServices
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

interface Assistant {
  fun answer(question: String): String
}

interface Ticket {
  val text: String
}

interface Tickets {
  fun save(text: String)
}

private val log = LoggerFactory.getLogger("negative")

// The factory returns the service; nothing the service says reaches a user here.
@Configuration
class AssistantConfig {
  @Bean
  fun assistant(model: ChatModel): Assistant = AiServices.create(Assistant::class.java, model)

  @Bean
  fun built(model: ChatModel): Assistant = AiServices.builder(Assistant::class.java).chatModel(model).build()
}

// The answer goes to a table and the log.
class Triager(model: ChatModel, private val tickets: Tickets) {
  private val assistant = AiServices.create(Assistant::class.java, model)

  fun triage(ticket: Ticket) {
    val answer = assistant.answer("Urgency of: ${ticket.text}")
    tickets.save(answer)
    log.info("urgency {}", answer)
  }
}
