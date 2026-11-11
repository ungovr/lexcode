// lexcode-expect: 7
package com.example.text

import dev.langchain4j.model.chat.ChatModel
import org.springframework.ai.chat.client.ChatClient
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

// A service whose functions hand model text to whoever calls them, outside any request handler.
class Summarizer(
  private val model: ChatModel,
  private val chatClient: ChatClient,
) {
  fun ask(q: String): String = model.chat(q)

  fun advise(q: String): String = chatClient.prompt().user(q).call().content()!!

  fun title(q: String) = model.chat("Title for: $q")

  // The result wrapped on its way out.
  fun reply(q: String): Reply {
    val answer = model.chat(q)
    return Reply(answer)
  }

  fun lines(q: String): List<String> {
    val answer = model.chat(q)
    return answer.lines()
  }
}

class Reply(val text: String)

// A mapped handler that returns model output is the reply rule's, so this rule counts it zero times.
@RestController
class Handler(private val model: ChatModel) {
  @GetMapping("/direct")
  fun direct(q: String): String = model.chat(q)

  @GetMapping("/direct2")
  fun direct2(q: String): String {
    val answer = model.chat(q)
    return answer
  }
}

// A function that is not a request handler: a scheduled job returns the model's output to its scheduler.
class Refresher(private val model: ChatModel) {
  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return model.chat("status")
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = model.chat("status")
}
