// lexcode-expect: 0
// Gemini output that stays inside the function that asked for it, and functions that call no model.
package com.example.negative.content

import kotlinx.coroutines.runBlocking
import com.google.ai.client.generativeai.GenerativeModel
import com.google.genai.Client
import org.slf4j.LoggerFactory

interface Tags {
  fun save(id: Long, tag: String)
}

private val log = LoggerFactory.getLogger("negative")

class Tagger(private val client: Client, private val model: GenerativeModel, private val tags: Tags) {
  // Saved and logged; the function answers with a flag.
  fun tag(id: Long, title: String): Boolean {
    val response = client.models.generateContent("gemini-2.5-flash", "One word tag for: $title", null)
    tags.save(id, response.text() ?: "")
    log.info("tag {}", response.text())
    return true
  }

  suspend fun retag(id: Long, title: String) {
    val response = model.generateContent("One word tag for: $title")
    tags.save(id, response.text ?: "")
  }
}

// A prompt builder and a counter call no model.
class Prompts {
  fun prompt(title: String): String = "One word tag for: $title"

  fun counts(ids: List<Long>): Int = ids.size
}

// The last expression of a lambda is not a return of the function.
class Warmer(private val client: Client) {
  fun warm(q: String) {
    runBlocking { client.models.generateContent("gemini-2.5-flash", q, null) }
  }
}
