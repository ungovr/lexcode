// lexcode-expect: 0
// The last expression of a lambda is not a return of the handler or the function, in each shape of call the engine may see.
package com.example.negative.audio

import com.aallam.openai.client.OpenAI
import kotlinx.coroutines.runBlocking
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController


// The last expression of a lambda is not a return, in each shape of call the engine may see.
@RestController
class LambdaHandlers(private val openAI: OpenAI) {
  @GetMapping("/l1")
  fun one(q: String): String {
    
    runBlocking { openAI.speech(null) }
    return "queued"
  }

  @GetMapping("/l2")
  fun two(q: String): String {
    
    launch(Dispatchers.IO) { openAI.speech(null) }
    return "queued"
  }

  @GetMapping("/l3")
  fun three(q: String): String {
    
    scope.launch { openAI.speech(null) }
    return "queued"
  }

  @GetMapping("/l4")
  fun four(q: String): String {
    
    scope.async(Dispatchers.IO) { openAI.speech(null) }
    return "queued"
  }

  @GetMapping("/l5")
  fun five(q: String): String {
    
    File("out.txt").bufferedWriter().use { w -> w.write(openAI.speech(null)) }
    return "ok"
  }

  @GetMapping("/l6")
  fun six(q: String): String {
    
    openAI.speech(null).also { r -> repo.save(r) }
    return "ok"
  }

  @GetMapping("/l7")
  fun seven(q: String): String {
    
    listOf(openAI.speech(null)).forEach { s -> repo.save(s) }
    return "ok"
  }

  @GetMapping("/l8")
  fun eight(q: String): String {
    
    openAI.speech(null).let { c -> repo.save(c) }
    return "ok"
  }
}

