// lexcode-expect: 0
// Lookalikes in a file that imports no Gemini SDK: a method named generateContent or startChat on an in-house class,
// and an AI-services-like factory that is not LangChain4j. Each one reaches a reply sink.
package com.example.negative.content

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

interface PageBuilder {
  fun generateContent(id: Long): String
  fun generateContentStream(id: Long): String
  fun startChat(id: Long): String
}

class Pages(val models: PageModels)

class PageModels {
  fun lookup(id: Long): String = "page-$id"
}

object Services {
  fun create(type: Class<*>): String = type.simpleName
  fun builder(): Services = this
  fun build(): String = "built"
}

@RestController
class PageController(private val pages: PageBuilder, private val registry: Pages) {
  // A method named generateContent that calls no model.
  @GetMapping("/page")
  fun page(id: Long): String = pages.generateContent(id)

  @GetMapping("/page/stream")
  fun stream(id: Long): ResponseEntity<String> = ResponseEntity.ok(pages.generateContentStream(id))

  @GetMapping("/page/chat")
  fun chat(id: Long): String {
    val session = pages.startChat(id)
    return session
  }

  @GetMapping("/page/lookup")
  fun lookup(id: Long): String = registry.models.lookup(id)

  @GetMapping("/service")
  fun service(): String = Services.create(String::class.java)

  @GetMapping("/service/built")
  fun built(): String = Services.builder().build()
}
