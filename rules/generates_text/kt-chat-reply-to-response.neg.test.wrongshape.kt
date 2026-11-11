// lexcode-expect: 0
// The vendors are imported, but each call is not a generating call (list, count, embed, stop), or its receiver is not a model.
package com.example.negative.text

import com.openai.client.OpenAIClient
import com.anthropic.client.AnthropicClient
import com.azure.ai.openai.OpenAIClient as AzureClient
import com.azure.ai.inference.ChatCompletionsClient
import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import dev.langchain4j.model.chat.ChatModel
import org.springframework.ai.chat.client.ChatClient
import io.github.ollama4j.OllamaAPI
import de.kherud.llama.LlamaModel
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Acme

@RestController
class H0(private val acme: Acme) {
  @GetMapping("/h0")
  fun reply(x: String): String = acme.completions().list(x)
}

class P0(private val acme: Acme) {
  fun plain(x: String): String = acme.completions().list(x)
}

@RestController
class H1(private val acme: Acme) {
  @GetMapping("/h1")
  fun reply(x: String): String = acme.responses().retrieve(x)
}

class P1(private val acme: Acme) {
  fun plain(x: String): String = acme.responses().retrieve(x)
}

@RestController
class H2(private val acme: Acme) {
  @GetMapping("/h2")
  fun reply(x: String): String = acme.messages().countTokens(x)
}

class P2(private val acme: Acme) {
  fun plain(x: String): String = acme.messages().countTokens(x)
}

@RestController
class H3(private val acme: Acme) {
  @GetMapping("/h3")
  fun reply(x: String): String = acme.getEmbeddings(x)
}

class P3(private val acme: Acme) {
  fun plain(x: String): String = acme.getEmbeddings(x)
}

@RestController
class H4(private val acme: Acme) {
  @GetMapping("/h4")
  fun reply(x: String): String = desk.complete(x)
}

class P4(private val acme: Acme) {
  fun plain(x: String): String = desk.complete(x)
}

@RestController
class H5(private val acme: Acme) {
  @GetMapping("/h5")
  fun reply(x: String): String = desk.completeStream(x)
}

class P5(private val acme: Acme) {
  fun plain(x: String): String = desk.completeStream(x)
}

@RestController
class H6(private val acme: Acme) {
  @GetMapping("/h6")
  fun reply(x: String): String = desk.chat(x)
}

class P6(private val acme: Acme) {
  fun plain(x: String): String = desk.chat(x)
}

@RestController
class H7(private val acme: Acme) {
  @GetMapping("/h7")
  fun reply(x: String): String = desk.generate(x)
}

class P7(private val acme: Acme) {
  fun plain(x: String): String = desk.generate(x)
}

@RestController
class H8(private val acme: Acme) {
  @GetMapping("/h8")
  fun reply(x: String): String = desk.call(x)
}

class P8(private val acme: Acme) {
  fun plain(x: String): String = desk.call(x)
}

@RestController
class H9(private val acme: Acme) {
  @GetMapping("/h9")
  fun reply(x: String): String = desk.stream(x)
}

class P9(private val acme: Acme) {
  fun plain(x: String): String = desk.stream(x)
}

@RestController
class H10(private val acme: Acme) {
  @GetMapping("/h10")
  fun reply(x: String): String = acme.invokeModel { modelId = "amazon.titan-embed-text-v2:0" }
}

class P10(private val acme: Acme) {
  fun plain(x: String): String = acme.invokeModel { modelId = "amazon.titan-embed-text-v2:0" }
}

@RestController
class H11(private val acme: Acme) {
  @GetMapping("/h11")
  fun reply(x: String): String = acme.invokeModelWithResponseStream { modelId = "amazon.titan-embed-text-v2:0" }
}

class P11(private val acme: Acme) {
  fun plain(x: String): String = acme.invokeModelWithResponseStream { modelId = "amazon.titan-embed-text-v2:0" }
}

@RestController
class H12(private val acme: Acme) {
  @GetMapping("/h12")
  fun reply(x: String): String = InvokeModelRequest { modelId = "amazon.titan-embed-text-v2:0" }
}

class P12(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelRequest { modelId = "amazon.titan-embed-text-v2:0" }
}

@RestController
class H13(private val acme: Acme) {
  @GetMapping("/h13")
  fun reply(x: String): String = InvokeModelRequest.builder().modelId("amazon.titan-embed-text-v2:0").build()
}

class P13(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelRequest.builder().modelId("amazon.titan-embed-text-v2:0").build()
}

@RestController
class H14(private val acme: Acme) {
  @GetMapping("/h14")
  fun reply(x: String): String = InvokeModelWithResponseStreamRequest { modelId = "amazon.titan-embed-text-v2:0" }
}

class P14(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelWithResponseStreamRequest { modelId = "amazon.titan-embed-text-v2:0" }
}

@RestController
class H15(private val acme: Acme) {
  @GetMapping("/h15")
  fun reply(x: String): String = InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-embed-text-v2:0").build()
}

class P15(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-embed-text-v2:0").build()
}
