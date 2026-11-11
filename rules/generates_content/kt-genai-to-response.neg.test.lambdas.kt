// lexcode-expect: 0
// The last expression of a lambda is not a return of the handler or the function, in each shape of call the engine may see.
package com.example.negative.content

import com.google.genai.Client
import dev.langchain4j.service.AiServices
import kotlinx.coroutines.runBlocking
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController


// The last expression of a lambda is not a return, in each shape of call the engine may see.
@RestController
class LambdaHandlers(private val client: Client) {
  @GetMapping("/l1")
  fun one(q: String): String {
    
    runBlocking { client.models.generateContent("m", q, null) }
    return "queued"
  }

  @GetMapping("/l2")
  fun two(q: String): String {
    
    launch(Dispatchers.IO) { client.models.generateContent("m", q, null) }
    return "queued"
  }

  @GetMapping("/l3")
  fun three(q: String): String {
    
    scope.launch { client.models.generateContent("m", q, null) }
    return "queued"
  }

  @GetMapping("/l4")
  fun four(q: String): String {
    
    scope.async(Dispatchers.IO) { client.models.generateContent("m", q, null) }
    return "queued"
  }

  @GetMapping("/l5")
  fun five(q: String): String {
    
    File("out.txt").bufferedWriter().use { w -> w.write(client.models.generateContent("m", q, null)) }
    return "ok"
  }

  @GetMapping("/l6")
  fun six(q: String): String {
    
    client.models.generateContent("m", q, null).also { r -> repo.save(r) }
    return "ok"
  }

  @GetMapping("/l7")
  fun seven(q: String): String {
    
    listOf(client.models.generateContent("m", q, null)).forEach { s -> repo.save(s) }
    return "ok"
  }

  @GetMapping("/l8")
  fun eight(q: String): String {
    
    client.models.generateContent("m", q, null).let { c -> repo.save(c) }
    return "ok"
  }
}

class LambdaPlain(private val client: Client) {
  fun one(q: String) {
    
    runBlocking { client.models.generateContent("m", q, null) }
  }

  fun two(q: String) {
    
    launch(Dispatchers.IO) { client.models.generateContent("m", q, null) }
  }

  fun three(q: String) {
    
    scope.launch { client.models.generateContent("m", q, null) }
  }

  fun four(q: String) {
    
    scope.async(Dispatchers.IO) { client.models.generateContent("m", q, null) }
  }

  fun five(q: String) {
    
    File("out.txt").bufferedWriter().use { w -> w.write(client.models.generateContent("m", q, null)) }
  }

  fun six(q: String) {
    
    client.models.generateContent("m", q, null).also { r -> repo.save(r) }
  }

  fun seven(q: String) {
    
    listOf(client.models.generateContent("m", q, null)).forEach { s -> repo.save(s) }
  }

  fun eight(q: String) {
    
    client.models.generateContent("m", q, null).let { c -> repo.save(c) }
  }
}


// The last expression of a lambda is not a return, in each shape of call the engine may see.
@RestController
class LambdaHandlers1(model: dev.langchain4j.model.chat.ChatModel) {
  @GetMapping("/l1")
  fun one(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    runBlocking { assistant.answer(q) }
    return "queued"
  }

  @GetMapping("/l2")
  fun two(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    launch(Dispatchers.IO) { assistant.answer(q) }
    return "queued"
  }

  @GetMapping("/l3")
  fun three(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    scope.launch { assistant.answer(q) }
    return "queued"
  }

  @GetMapping("/l4")
  fun four(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    scope.async(Dispatchers.IO) { assistant.answer(q) }
    return "queued"
  }

  @GetMapping("/l5")
  fun five(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    File("out.txt").bufferedWriter().use { w -> w.write(assistant.answer(q)) }
    return "ok"
  }

  @GetMapping("/l6")
  fun six(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    assistant.answer(q).also { r -> repo.save(r) }
    return "ok"
  }

  @GetMapping("/l7")
  fun seven(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    listOf(assistant.answer(q)).forEach { s -> repo.save(s) }
    return "ok"
  }

  @GetMapping("/l8")
  fun eight(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    assistant.answer(q).let { c -> repo.save(c) }
    return "ok"
  }
}

class LambdaPlain1(model: dev.langchain4j.model.chat.ChatModel) {
  fun one(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    runBlocking { assistant.answer(q) }
  }

  fun two(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    launch(Dispatchers.IO) { assistant.answer(q) }
  }

  fun three(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    scope.launch { assistant.answer(q) }
  }

  fun four(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    scope.async(Dispatchers.IO) { assistant.answer(q) }
  }

  fun five(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    File("out.txt").bufferedWriter().use { w -> w.write(assistant.answer(q)) }
  }

  fun six(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    assistant.answer(q).also { r -> repo.save(r) }
  }

  fun seven(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    listOf(assistant.answer(q)).forEach { s -> repo.save(s) }
  }

  fun eight(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    assistant.answer(q).let { c -> repo.save(c) }
  }
}

