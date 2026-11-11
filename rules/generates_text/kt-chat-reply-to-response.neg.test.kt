// lexcode-expect: 0
// Lookalikes in a file that imports no model vendor: generic method names on receivers that are not models, and an
// in-house chat service. Each one reaches a reply sink, so a rule that matched the bare method name would fire.
package com.example.negative.text

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

class Post(val title: String)

interface Forum {
  fun messages(): Messages
  fun completions(): Messages
  fun responses(): Messages
  fun chat(): Chat
}

interface Chat {
  fun completions(): Messages
}

interface Messages {
  fun create(post: Post): String
  fun createStreaming(post: Post): String
}

interface HelpDesk {
  fun chat(text: String): String
  fun generate(text: String): String
  fun call(text: String): String
  fun complete(text: String): String
  fun converse(text: String): String
  fun getCompletions(text: String): String
  fun getChatCompletions(text: String): String
}

interface Invoker {
  fun invokeModel(request: Any): String
}

@RestController
class SupportController(
  private val forum: Forum,
  private val desk: HelpDesk,
  private val invoker: Invoker,
  private val billing: BillingGateway,
) {
  // An Anthropic-style messages().create on a forum, with no Anthropic import in the file.
  @PostMapping("/forum/reply")
  fun reply(@RequestBody post: Post): String {
    val saved = forum.messages().create(post)
    return saved
  }

  @PostMapping("/forum/draft")
  fun draft(@RequestBody post: Post): ResponseEntity<String> = ResponseEntity.ok(forum.completions().create(post))

  @PostMapping("/forum/answer")
  fun answer(@RequestBody post: Post): String = forum.responses().createStreaming(post)

  // Generic model-call names on an in-house help desk, no vendor import in the file.
  @GetMapping("/desk/chat")
  fun chat(text: String): String = desk.chat(text)

  @GetMapping("/desk/generate")
  fun generate(text: String): ResponseEntity<String> = ResponseEntity.ok(desk.generate(text))

  @GetMapping("/desk/call")
  fun call(text: String): String = desk.call(text)

  @GetMapping("/desk/complete")
  fun complete(text: String): String = desk.complete(text)

  @GetMapping("/desk/converse")
  fun converse(text: String): String = desk.converse(text)

  @GetMapping("/desk/completions")
  fun completions(text: String): String = desk.getCompletions(text)

  @GetMapping("/desk/chat-completions")
  fun chatCompletions(text: String): String = desk.getChatCompletions(text)

  // A bank wire request, not a Bedrock model call.
  @GetMapping("/billing/invoke")
  fun invoke(): String = invoker.invokeModel(billing)

  // A streaming callback of an in-house listener, with no LangChain4j import.
  @PostMapping("/listener")
  fun listener(): String {
    var seen = ""
    val listener = object : TokenListener {
      override fun onPartialResponse(partialResponse: String) {
        seen += partialResponse
      }
    }
    listener.onPartialResponse("a")
    return seen
  }
}

interface BillingGateway

interface TokenListener {
  fun onPartialResponse(partialResponse: String)
}
