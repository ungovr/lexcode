// lexcode-expect: 0
// LangChain4j and Spring AI calls whose text stays inside the function that asked for it, and lookalikes that call no
// model.
package com.example.negative.text

import dev.langchain4j.model.chat.ChatModel
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient

class Row(val id: Long, val text: String)

interface Notes {
  fun save(row: Row)
}

class Desk {
  fun chat(text: String): String = text
}

private val log = LoggerFactory.getLogger("negative")

class Tagger(
  private val model: ChatModel,
  private val chatClient: ChatClient,
  private val notes: Notes,
  private val desk: Desk,
) {
  // Saved and logged; the function answers with a flag.
  fun tag(id: Long): Boolean {
    val answer = model.chat("One word tag for ticket $id")
    notes.save(Row(id, answer))
    log.info("tag {}: {}", id, answer)
    return true
  }

  fun review(id: Long) {
    notes.save(Row(id, chatClient.prompt().user("Review $id").call().content() ?: ""))
  }

  // A prompt builder and an in-house help desk call no model.
  fun prompt(ticket: String): String = "Summarize this ticket in one line: $ticket"

  fun relay(text: String): String = desk.chat(text)
}
