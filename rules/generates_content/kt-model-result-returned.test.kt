// lexcode-expect: 8
package com.example.content

import org.springframework.scheduling.annotation.Scheduled
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.GetMapping
import com.google.ai.client.generativeai.GenerativeModel
import com.google.genai.Client

// Functions that hand Gemini output to whoever calls them, outside any request handler.
class Writer(private val client: Client, private val model: GenerativeModel) {
  fun caption(text: String): String {
    val response = client.models.generateContent("gemini-2.5-flash", "Caption this: $text", null)
    return response.text()
  }

  suspend fun describe(photoUrl: String): String {
    val response = model.generateContent("Describe this: $photoUrl")
    return response.text ?: ""
  }

  fun story(topic: String): String = client.models.generateContent("gemini-2.5-flash", "Tell a story about $topic", null).text()

  suspend fun joke() = model.generateContent("Tell a joke").text

  suspend fun chat(prompt: String): String {
    val chat = model.startChat()
    return chat.sendMessage(prompt).text ?: ""
  }

  fun created(q: String): String {
    val session = client.chats.create("gemini-2.5-flash")
    return session.sendMessage(q).text()
  }
}

// A mapped handler that returns model output is the reply rule's, so this rule counts it zero times.
@RestController
class Handler(private val client: Client) {
  @GetMapping("/direct")
  fun direct(q: String): String = client.models.generateContent("gemini-2.5-flash", q, null).text()

  @GetMapping("/direct2")
  fun direct2(q: String): String {
    val answer = client.models.generateContent("gemini-2.5-flash", q, null).text()
    return answer
  }
}

// A function that is not a request handler: a scheduled job returns the model's output to its scheduler.
class Refresher(private val client: Client) {
  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return client.models.generateContent("gemini-2.5-flash", "status", null).text()
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = client.models.generateContent("gemini-2.5-flash", "status", null).text()
}
