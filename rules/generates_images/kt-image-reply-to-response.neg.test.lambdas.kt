// lexcode-expect: 0
// The last expression of a lambda is not a return of the handler or the function, in each shape of call the engine may see.
package com.example.negative.image

import com.openai.client.OpenAIClient
import com.openai.models.images.ImageGenerateParams
import kotlinx.coroutines.runBlocking
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController


// The last expression of a lambda is not a return, in each shape of call the engine may see.
@RestController
class LambdaHandlers(private val client: OpenAIClient) {
  @GetMapping("/l1")
  fun one(q: String): String {
    
    runBlocking { client.images().generate(ImageGenerateParams.builder().build()) }
    return "queued"
  }

  @GetMapping("/l2")
  fun two(q: String): String {
    
    launch(Dispatchers.IO) { client.images().generate(ImageGenerateParams.builder().build()) }
    return "queued"
  }

  @GetMapping("/l3")
  fun three(q: String): String {
    
    scope.launch { client.images().generate(ImageGenerateParams.builder().build()) }
    return "queued"
  }

  @GetMapping("/l4")
  fun four(q: String): String {
    
    scope.async(Dispatchers.IO) { client.images().generate(ImageGenerateParams.builder().build()) }
    return "queued"
  }

  @GetMapping("/l5")
  fun five(q: String): String {
    
    File("out.txt").bufferedWriter().use { w -> w.write(client.images().generate(ImageGenerateParams.builder().build())) }
    return "ok"
  }

  @GetMapping("/l6")
  fun six(q: String): String {
    
    client.images().generate(ImageGenerateParams.builder().build()).also { r -> repo.save(r) }
    return "ok"
  }

  @GetMapping("/l7")
  fun seven(q: String): String {
    
    listOf(client.images().generate(ImageGenerateParams.builder().build())).forEach { s -> repo.save(s) }
    return "ok"
  }

  @GetMapping("/l8")
  fun eight(q: String): String {
    
    client.images().generate(ImageGenerateParams.builder().build()).let { c -> repo.save(c) }
    return "ok"
  }

  @GetMapping("/l9")
  fun nine(q: String): String {
    
    listOf(q).forEachIndexed { i, s -> repo.save(i, client.images().generate(ImageGenerateParams.builder().build())) }
    return "ok"
  }

  @GetMapping("/l10")
  fun ten(q: String): String {
    
    mapOf(q to q).forEach { k, v -> repo.save(k, client.images().generate(ImageGenerateParams.builder().build())) }
    return "ok"
  }

  @GetMapping("/l11")
  fun eleven(q: String): String {
    
    var out = ""
    client.images().generate(ImageGenerateParams.builder().build()).also { out = "constant" }
    return out
  }

  @GetMapping("/l12")
  fun twelve(q: String): String {
    
    var out = ""
    client.images().generate(ImageGenerateParams.builder().build())?.also { out = "constant" }
    return out
  }

  @GetMapping("/l13")
  fun thirteen(q: String): String {
    
    val f = { s: String -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    f(q)
    return "ok"
  }

  @GetMapping("/l14")
  fun fourteen(q: String): String {
    
    repo.tx3(1, 2) { a, b, c -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    return "ok"
  }

  @GetMapping("/l15")
  fun fifteen(q: String): String {
    
    val f = { a: Int, b: Int -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    f(1, 2)
    return "ok"
  }

  @GetMapping("/l16")
  fun sixteen(q: String): String {
    
    val f = { s -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    f(q)
    return "ok"
  }

  @GetMapping("/l17")
  fun seventeen(q: String): String {
    
    val f = { a: Int, b: Int, c: Int -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    f(1, 2, 3)
    return "ok"
  }

  @GetMapping("/l18")
  fun eighteen(q: String): String {
    
    var out = ""
    client.images().generate(ImageGenerateParams.builder().build()).forEach { out = "constant" }
    return out
  }

  @GetMapping("/l19")
  fun nineteen(q: String): String {
    
    var out = ""
    client.images().generate(ImageGenerateParams.builder().build()).collect { out = "constant" }
    return out
  }
}

class LambdaPlain(private val client: OpenAIClient) {
  fun one(q: String) {
    
    runBlocking { client.images().generate(ImageGenerateParams.builder().build()) }
  }

  fun two(q: String) {
    
    launch(Dispatchers.IO) { client.images().generate(ImageGenerateParams.builder().build()) }
  }

  fun three(q: String) {
    
    scope.launch { client.images().generate(ImageGenerateParams.builder().build()) }
  }

  fun four(q: String) {
    
    scope.async(Dispatchers.IO) { client.images().generate(ImageGenerateParams.builder().build()) }
  }

  fun five(q: String) {
    
    File("out.txt").bufferedWriter().use { w -> w.write(client.images().generate(ImageGenerateParams.builder().build())) }
  }

  fun six(q: String) {
    
    client.images().generate(ImageGenerateParams.builder().build()).also { r -> repo.save(r) }
  }

  fun seven(q: String) {
    
    listOf(client.images().generate(ImageGenerateParams.builder().build())).forEach { s -> repo.save(s) }
  }

  fun eight(q: String) {
    
    client.images().generate(ImageGenerateParams.builder().build()).let { c -> repo.save(c) }
  }

  fun nine(q: String) {
    
    listOf(q).forEachIndexed { i, s -> repo.save(i, client.images().generate(ImageGenerateParams.builder().build())) }
  }

  fun ten(q: String) {
    
    mapOf(q to q).forEach { k, v -> repo.save(k, client.images().generate(ImageGenerateParams.builder().build())) }
  }

  fun eleven(q: String): String {
    
    var out = ""
    client.images().generate(ImageGenerateParams.builder().build()).also { out = "constant" }
    return out
  }

  fun twelve(q: String): String {
    
    var out = ""
    client.images().generate(ImageGenerateParams.builder().build())?.also { out = "constant" }
    return out
  }

  fun thirteen(q: String): String {
    
    val f = { s: String -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    f(q)
    return "ok"
  }

  fun fourteen(q: String): String {
    
    repo.tx3(1, 2) { a, b, c -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    return "ok"
  }

  fun fifteen(q: String): String {
    
    val f = { a: Int, b: Int -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    f(1, 2)
    return "ok"
  }

  fun sixteen(q: String): String {
    
    val f = { s -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    f(q)
    return "ok"
  }

  fun seventeen(q: String): String {
    
    val f = { a: Int, b: Int, c: Int -> repo.save(client.images().generate(ImageGenerateParams.builder().build())) }
    f(1, 2, 3)
    return "ok"
  }

  fun eighteen(q: String): String {
    
    var out = ""
    client.images().generate(ImageGenerateParams.builder().build()).forEach { out = "constant" }
    return out
  }

  fun nineteen(q: String): String {
    
    var out = ""
    client.images().generate(ImageGenerateParams.builder().build()).collect { out = "constant" }
    return out
  }
}

