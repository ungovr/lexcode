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
}

