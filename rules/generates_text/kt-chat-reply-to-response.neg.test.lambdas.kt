// lexcode-expect: 0
// The last expression of a lambda is not a return of the handler or the function, in each shape of call the engine may see.
package com.example.negative.text

import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import dev.langchain4j.model.chat.ChatModel
import kotlinx.coroutines.runBlocking
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController


// The last expression of a lambda is not a return, in each shape of call the engine may see.
@RestController
class LambdaHandlers(private val model: ChatModel) {
  @GetMapping("/l1")
  fun one(q: String): String {
    
    runBlocking { model.chat(q) }
    return "queued"
  }

  @GetMapping("/l2")
  fun two(q: String): String {
    
    launch(Dispatchers.IO) { model.chat(q) }
    return "queued"
  }

  @GetMapping("/l3")
  fun three(q: String): String {
    
    scope.launch { model.chat(q) }
    return "queued"
  }

  @GetMapping("/l4")
  fun four(q: String): String {
    
    scope.async(Dispatchers.IO) { model.chat(q) }
    return "queued"
  }
}

class LambdaPlain(private val model: ChatModel) {
  fun one(q: String) {
    
    runBlocking { model.chat(q) }
  }

  fun two(q: String) {
    
    launch(Dispatchers.IO) { model.chat(q) }
  }

  fun three(q: String) {
    
    scope.launch { model.chat(q) }
  }

  fun four(q: String) {
    
    scope.async(Dispatchers.IO) { model.chat(q) }
  }
}


// The last expression of a lambda is not a return, in each shape of call the engine may see.
@RestController
class LambdaHandlers1(private val openai: OpenAIClient) {
  @GetMapping("/l1")
  fun one(q: String): String {
    
    runBlocking { openai.chat().completions().create(ChatCompletionCreateParams.builder().build()) }
    return "queued"
  }

  @GetMapping("/l2")
  fun two(q: String): String {
    
    launch(Dispatchers.IO) { openai.chat().completions().create(ChatCompletionCreateParams.builder().build()) }
    return "queued"
  }

  @GetMapping("/l3")
  fun three(q: String): String {
    
    scope.launch { openai.chat().completions().create(ChatCompletionCreateParams.builder().build()) }
    return "queued"
  }

  @GetMapping("/l4")
  fun four(q: String): String {
    
    scope.async(Dispatchers.IO) { openai.chat().completions().create(ChatCompletionCreateParams.builder().build()) }
    return "queued"
  }
}

class LambdaPlain1(private val openai: OpenAIClient) {
  fun one(q: String) {
    
    runBlocking { openai.chat().completions().create(ChatCompletionCreateParams.builder().build()) }
  }

  fun two(q: String) {
    
    launch(Dispatchers.IO) { openai.chat().completions().create(ChatCompletionCreateParams.builder().build()) }
  }

  fun three(q: String) {
    
    scope.launch { openai.chat().completions().create(ChatCompletionCreateParams.builder().build()) }
  }

  fun four(q: String) {
    
    scope.async(Dispatchers.IO) { openai.chat().completions().create(ChatCompletionCreateParams.builder().build()) }
  }
}

