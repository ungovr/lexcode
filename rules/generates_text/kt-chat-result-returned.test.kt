// lexcode-expect: 10
package com.example.text

import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import com.aallam.openai.api.chat.ChatCompletionRequest
import com.aallam.openai.client.OpenAI
import com.anthropic.client.AnthropicClient
import com.anthropic.models.messages.MessageCreateParams
import com.openai.client.OpenAIClient
import com.openai.models.chat.completions.ChatCompletionCreateParams
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

// A service whose functions hand model text to whoever calls them, outside any request handler.
class Summarizer(
  private val openai: OpenAIClient,
  private val anthropic: AnthropicClient,
  private val openAI: OpenAI,
  private val bedrock: BedrockRuntimeClient,
) {
  fun summarize(text: String): String {
    val completion = openai.chat().completions().create(ChatCompletionCreateParams.builder().build())
    return completion.choices()[0].message().content().orElse("")
  }

  fun draft(text: String): String {
    val message = anthropic.messages().create(MessageCreateParams.builder().build())
    return message.content()[0].text().get().text()
  }

  suspend fun translate(text: String): String {
    val completion = openAI.chatCompletion(ChatCompletionRequest.Builder().build())
    return completion.choices.first().message.content ?: ""
  }

  suspend fun converse(text: String): String {
    val result = bedrock.converse { modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0" }
    return result.output.toString()
  }

  // Expression bodies.
  fun ask(q: String): String = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()

  fun title(q: String) = anthropic.messages().create(MessageCreateParams.builder().build()).toString()

  // The result wrapped on its way out.
  fun reply(q: String): Reply {
    val answer = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
    return Reply(answer)
  }

  fun lines(q: String): List<String> {
    val answer = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
    return answer.lines()
  }
}

class Reply(val text: String)

// The handler is the reply rule's; the function it calls is this rule's, once.
@RestController
class Front(private val summarizer: Summarizer) {
  @GetMapping("/summary")
  fun summary(q: String): String = summarizer.summarize(q)
}

// A mapped handler that returns model output is the reply rule's, so this rule counts it zero times.
@RestController
class Handler(private val openai: OpenAIClient) {
  @GetMapping("/direct")
  fun direct(q: String): String = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()

  @GetMapping("/direct2")
  fun direct2(q: String): String {
    val answer = openai.chat().completions().create(ChatCompletionCreateParams.builder().build()).toString()
    return answer
  }
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
