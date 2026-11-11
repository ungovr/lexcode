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

  @GetMapping("/l9")
  fun nine(q: String): String {
    
    listOf(q).forEachIndexed { i, s -> repo.save(i, client.models.generateContent("m", q, null)) }
    return "ok"
  }

  @GetMapping("/l10")
  fun ten(q: String): String {
    
    mapOf(q to q).forEach { k, v -> repo.save(k, client.models.generateContent("m", q, null)) }
    return "ok"
  }

  @GetMapping("/l11")
  fun eleven(q: String): String {
    
    var out = ""
    client.models.generateContent("m", q, null).also { out = "constant" }
    return out
  }

  @GetMapping("/l12")
  fun twelve(q: String): String {
    
    var out = ""
    client.models.generateContent("m", q, null)?.also { out = "constant" }
    return out
  }

  @GetMapping("/l13")
  fun thirteen(q: String): String {
    
    val f = { s: String -> repo.save(client.models.generateContent("m", q, null)) }
    f(q)
    return "ok"
  }

  @GetMapping("/l14")
  fun fourteen(q: String): String {
    
    repo.tx3(1, 2) { a, b, c -> repo.save(client.models.generateContent("m", q, null)) }
    return "ok"
  }

  @GetMapping("/l15")
  fun fifteen(q: String): String {
    
    val f = { a: Int, b: Int -> repo.save(client.models.generateContent("m", q, null)) }
    f(1, 2)
    return "ok"
  }

  @GetMapping("/l16")
  fun sixteen(q: String): String {
    
    val f = { s -> repo.save(client.models.generateContent("m", q, null)) }
    f(q)
    return "ok"
  }

  @GetMapping("/l17")
  fun seventeen(q: String): String {
    
    val f = { a: Int, b: Int, c: Int -> repo.save(client.models.generateContent("m", q, null)) }
    f(1, 2, 3)
    return "ok"
  }

  @GetMapping("/l18")
  fun eighteen(q: String): String {
    
    var out = ""
    client.models.generateContent("m", q, null).forEach { out = "constant" }
    return out
  }

  @GetMapping("/l19")
  fun nineteen(q: String): String {
    
    var out = ""
    client.models.generateContent("m", q, null).collect { out = "constant" }
    return out
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

  fun nine(q: String) {
    
    listOf(q).forEachIndexed { i, s -> repo.save(i, client.models.generateContent("m", q, null)) }
  }

  fun ten(q: String) {
    
    mapOf(q to q).forEach { k, v -> repo.save(k, client.models.generateContent("m", q, null)) }
  }

  fun eleven(q: String): String {
    
    var out = ""
    client.models.generateContent("m", q, null).also { out = "constant" }
    return out
  }

  fun twelve(q: String): String {
    
    var out = ""
    client.models.generateContent("m", q, null)?.also { out = "constant" }
    return out
  }

  fun thirteen(q: String): String {
    
    val f = { s: String -> repo.save(client.models.generateContent("m", q, null)) }
    f(q)
    return "ok"
  }

  fun fourteen(q: String): String {
    
    repo.tx3(1, 2) { a, b, c -> repo.save(client.models.generateContent("m", q, null)) }
    return "ok"
  }

  fun fifteen(q: String): String {
    
    val f = { a: Int, b: Int -> repo.save(client.models.generateContent("m", q, null)) }
    f(1, 2)
    return "ok"
  }

  fun sixteen(q: String): String {
    
    val f = { s -> repo.save(client.models.generateContent("m", q, null)) }
    f(q)
    return "ok"
  }

  fun seventeen(q: String): String {
    
    val f = { a: Int, b: Int, c: Int -> repo.save(client.models.generateContent("m", q, null)) }
    f(1, 2, 3)
    return "ok"
  }

  fun eighteen(q: String): String {
    
    var out = ""
    client.models.generateContent("m", q, null).forEach { out = "constant" }
    return out
  }

  fun nineteen(q: String): String {
    
    var out = ""
    client.models.generateContent("m", q, null).collect { out = "constant" }
    return out
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

  @GetMapping("/l9")
  fun nine(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    listOf(q).forEachIndexed { i, s -> repo.save(i, assistant.answer(q)) }
    return "ok"
  }

  @GetMapping("/l10")
  fun ten(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    mapOf(q to q).forEach { k, v -> repo.save(k, assistant.answer(q)) }
    return "ok"
  }

  @GetMapping("/l11")
  fun eleven(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    var out = ""
    assistant.answer(q).also { out = "constant" }
    return out
  }

  @GetMapping("/l12")
  fun twelve(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    var out = ""
    assistant.answer(q)?.also { out = "constant" }
    return out
  }

  @GetMapping("/l13")
  fun thirteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    val f = { s: String -> repo.save(assistant.answer(q)) }
    f(q)
    return "ok"
  }

  @GetMapping("/l14")
  fun fourteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    repo.tx3(1, 2) { a, b, c -> repo.save(assistant.answer(q)) }
    return "ok"
  }

  @GetMapping("/l15")
  fun fifteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    val f = { a: Int, b: Int -> repo.save(assistant.answer(q)) }
    f(1, 2)
    return "ok"
  }

  @GetMapping("/l16")
  fun sixteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    val f = { s -> repo.save(assistant.answer(q)) }
    f(q)
    return "ok"
  }

  @GetMapping("/l17")
  fun seventeen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    val f = { a: Int, b: Int, c: Int -> repo.save(assistant.answer(q)) }
    f(1, 2, 3)
    return "ok"
  }

  @GetMapping("/l18")
  fun eighteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    var out = ""
    assistant.answer(q).forEach { out = "constant" }
    return out
  }

  @GetMapping("/l19")
  fun nineteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    var out = ""
    assistant.answer(q).collect { out = "constant" }
    return out
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

  fun nine(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    listOf(q).forEachIndexed { i, s -> repo.save(i, assistant.answer(q)) }
  }

  fun ten(q: String) {
    val assistant = AiServices.create(Assistant::class.java, model)
    mapOf(q to q).forEach { k, v -> repo.save(k, assistant.answer(q)) }
  }

  fun eleven(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    var out = ""
    assistant.answer(q).also { out = "constant" }
    return out
  }

  fun twelve(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    var out = ""
    assistant.answer(q)?.also { out = "constant" }
    return out
  }

  fun thirteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    val f = { s: String -> repo.save(assistant.answer(q)) }
    f(q)
    return "ok"
  }

  fun fourteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    repo.tx3(1, 2) { a, b, c -> repo.save(assistant.answer(q)) }
    return "ok"
  }

  fun fifteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    val f = { a: Int, b: Int -> repo.save(assistant.answer(q)) }
    f(1, 2)
    return "ok"
  }

  fun sixteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    val f = { s -> repo.save(assistant.answer(q)) }
    f(q)
    return "ok"
  }

  fun seventeen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    val f = { a: Int, b: Int, c: Int -> repo.save(assistant.answer(q)) }
    f(1, 2, 3)
    return "ok"
  }

  fun eighteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    var out = ""
    assistant.answer(q).forEach { out = "constant" }
    return out
  }

  fun nineteen(q: String): String {
    val assistant = AiServices.create(Assistant::class.java, model)
    var out = ""
    assistant.answer(q).collect { out = "constant" }
    return out
  }
}

