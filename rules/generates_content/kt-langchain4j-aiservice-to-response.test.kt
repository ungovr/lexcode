// lexcode-expect: 4
package com.example.content

import org.springframework.scheduling.annotation.Scheduled
import android.content.Context
import android.widget.TextView
import android.widget.Toast
import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.service.AiServices
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

interface Assistant {
  fun answer(question: String): String
}

@RestController
class AssistantController(model: ChatModel) {
  private val assistant = AiServices.create(Assistant::class.java, model)
  private val built = AiServices.builder(Assistant::class.java).chatModel(model).build()

  // The method's return type is the interface's, so the kind of content is not fixed.
  @GetMapping("/ask")
  fun ask(@RequestParam q: String): String = assistant.answer(q)

  @GetMapping("/ask2")
  fun ask2(@RequestParam q: String): ResponseEntity<String> = ResponseEntity.ok(built.answer(q))
}

class Screen(model: ChatModel) {
  private val assistant = AiServices.create(Assistant::class.java, model)

  fun show(view: TextView, q: String) {
    view.text = assistant.answer(q)
  }

  fun toast(context: Context, q: String) {
    Toast.makeText(context, assistant.answer(q), Toast.LENGTH_SHORT).show()
  }
}

// A function that is not a request handler: a scheduled job returns the service's output to its scheduler.
class Refresher(model: ChatModel) {
  private val assistant = AiServices.create(Assistant::class.java, model)

  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return assistant.answer("status")
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = assistant.answer("status")
}
