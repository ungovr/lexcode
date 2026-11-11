// lexcode-expect: 0
// Chat calls whose text stays inside the function that asked for it, and lookalikes that call no model.
package com.example.negative.text

import kotlinx.coroutines.runBlocking
import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.model.embedding.EmbeddingModel
import org.slf4j.LoggerFactory

class Row(val id: Long, val text: String)

interface Notes {
  fun save(row: Row)
}

class TicketDesk {
  fun chat(text: String): String = text
}

private val log = LoggerFactory.getLogger("negative")

class Tagger(
  private val client: OpenAIClient,
  private val model: ChatModel,
  private val embeddings: EmbeddingModel,
  private val notes: Notes,
  private val desk: TicketDesk,
) {
  // The text is saved and logged; the function answers with a boolean.
  fun tag(id: Long): Boolean {
    val completion = client.chat().completions().create(ChatCompletionCreateParams.builder().build())
    val text = completion.choices()[0].message().content().orElse("")
    notes.save(Row(id, text))
    log.info("tag {}: {}", id, text)
    return true
  }

  fun tagQuietly(id: Long) {
    val answer = model.chat("One word tag for ticket $id")
    notes.save(Row(id, answer))
  }

  // Embeddings are vectors, not text.
  fun vectorOf(text: String): List<Float> = embeddings.embed(text).content().vectorAsList()

  // A prompt builder calls no model.
  fun prompt(ticket: String): String = "Summarize this ticket in one line: $ticket"

  // A chat(String) on an in-house help desk.
  fun relay(text: String): String = desk.chat(text)
}

// The last expression of a lambda is not a return of the function.
class Warmer(private val model: ChatModel) {
  fun warm(q: String) {
    runBlocking { model.chat(q) }
  }
}
