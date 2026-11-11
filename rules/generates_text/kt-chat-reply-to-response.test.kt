// lexcode-expect: 14
package com.example.text

import android.content.Context
import android.widget.TextView
import android.widget.Toast
import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.client.OpenAI
import com.anthropic.client.AnthropicClient
import com.anthropic.models.messages.MessageCreateParams
import com.azure.ai.inference.ChatCompletionsClient
import com.azure.ai.openai.OpenAIClient as AzureOpenAIClient
import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import com.openai.models.responses.ResponseCreateParams
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseEntity
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
class ChatController(
  private val openai: OpenAIClient,
  private val anthropic: AnthropicClient,
  private val azure: AzureOpenAIClient,
  private val inference: ChatCompletionsClient,
  private val bedrock: BedrockRuntimeClient,
) {
  // OpenAI Java SDK, returned from a block-bodied handler.
  @PostMapping("/chat")
  fun chat(@RequestParam q: String): String {
    val completion = openai.chat().completions().create(ChatCompletionCreateParams.builder().build())
    return completion.choices()[0].message().content().orElse("")
  }

  // Responses API, an expression-bodied handler wrapped in a ResponseEntity.
  @GetMapping("/respond")
  fun respond(@RequestParam q: String): ResponseEntity<String> =
    ResponseEntity.ok(openai.responses().create(ResponseCreateParams.builder().build()).outputText())

  // Anthropic Java SDK from Kotlin, in a ResponseEntity builder chain.
  @GetMapping("/claude")
  fun claude(@RequestParam q: String): ResponseEntity<String> {
    val message = anthropic.messages().create(MessageCreateParams.builder().build())
    return ResponseEntity.status(200).body(message.content()[0].text().get().text())
  }

  // Azure OpenAI, written to the browser a chunk at a time.
  @GetMapping("/azure")
  fun azureStream(@RequestParam q: String): SseEmitter {
    val emitter = SseEmitter()
    val completions = azure.getChatCompletions("gpt-4o", null)
    emitter.send(completions.choices[0].message.content)
    return emitter
  }

  // Azure AI Inference, written through the servlet response.
  @GetMapping("/inference")
  fun inference(@RequestParam q: String, response: HttpServletResponse) {
    val reply = inference.complete(null)
    response.writer.println(reply.choice.message.content)
  }

  // Bedrock Converse, rendered into a server-side page.
  @GetMapping("/converse")
  suspend fun converse(@RequestParam q: String, model: Model): String {
    val result = bedrock.converse { modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0" }
    model.addAttribute("answer", result.output)
    return "answer"
  }
}

// openai-kotlin, answered over Ktor.
fun Route.chatRoutes(openAI: OpenAI) {
  post("/chat") {
    val completion = openAI.chatCompletion(ChatCompletionRequest.Builder().build())
    call.respond(completion.choices.first().message.content ?: "")
  }
}

// Android screens: a text view, a toast, a state holder a screen reads.
class ChatScreen(private val context: Context, private val openai: OpenAIClient) {
  fun show(view: TextView, q: String) {
    view.text = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
  }

  fun toast(q: String) {
    Toast.makeText(context, openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString(), Toast.LENGTH_LONG).show()
  }
}

class ChatViewModel(private val openai: OpenAIClient) {
  private val _uiState = MutableStateFlow("")

  fun ask(q: String) {
    val answer = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
    _uiState.value = answer
  }
}

@Composable
fun Answer(openai: OpenAIClient, q: String) {
  val answer = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
  Text(text = answer)
}

fun bedrockInvoke(bedrock: BedrockRuntimeClient, view: TextView) = runBlocking {
  val response = bedrock.invokeModel {
    modelId = "anthropic.claude-3-haiku-20240307-v1:0"
    body = "{}".toByteArray()
  }
  view.setText(String(response.body))
}

// The servlet writer named out or pw, inside a function that takes the servlet response.
fun servletWriter(openai: OpenAIClient, response: HttpServletResponse) {
  val t = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
  out.write(t)
  pw.println(t)
}

// A function that is not a request handler: a scheduled job returns the model's output to its scheduler.
class Refresher(private val openai: OpenAIClient) {
  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
}
