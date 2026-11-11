// lexcode-expect: 0
// The vendors are imported, but each call is not a generating call (list, count, embed, stop), or its receiver is not a model.
package com.example.negative.image

import com.openai.client.OpenAIClient
import com.aallam.openai.client.OpenAI
import com.google.firebase.vertexai.ImagenModel
import com.azure.ai.openai.OpenAIClient as AzureClient
import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import dev.langchain4j.model.image.ImageModel
import org.springframework.ai.image.ImageModel as SpringImageModel
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Acme

@RestController
class H0(private val acme: Acme) {
  @GetMapping("/h0")
  fun reply(x: String): String = thumbnailer.generate(x)
}

class P0(private val acme: Acme) {
  fun plain(x: String): String = thumbnailer.generate(x)
}

@RestController
class H1(private val acme: Acme) {
  @GetMapping("/h1")
  fun reply(x: String): String = acme.invokeModel { modelId = "anthropic.claude-3" }
}

class P1(private val acme: Acme) {
  fun plain(x: String): String = acme.invokeModel { modelId = "anthropic.claude-3" }
}

@RestController
class H2(private val acme: Acme) {
  @GetMapping("/h2")
  fun reply(x: String): String = acme.invokeModelWithResponseStream { modelId = "anthropic.claude-3" }
}

class P2(private val acme: Acme) {
  fun plain(x: String): String = acme.invokeModelWithResponseStream { modelId = "anthropic.claude-3" }
}

@RestController
class H3(private val acme: Acme) {
  @GetMapping("/h3")
  fun reply(x: String): String = InvokeModelRequest { modelId = "anthropic.claude-3" }
}

class P3(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelRequest { modelId = "anthropic.claude-3" }
}

@RestController
class H4(private val acme: Acme) {
  @GetMapping("/h4")
  fun reply(x: String): String = InvokeModelRequest.builder().modelId("anthropic.claude-3").build()
}

class P4(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelRequest.builder().modelId("anthropic.claude-3").build()
}

@RestController
class H5(private val acme: Acme) {
  @GetMapping("/h5")
  fun reply(x: String): String = InvokeModelWithResponseStreamRequest { modelId = "anthropic.claude-3" }
}

class P5(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelWithResponseStreamRequest { modelId = "anthropic.claude-3" }
}

@RestController
class H6(private val acme: Acme) {
  @GetMapping("/h6")
  fun reply(x: String): String = InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3").build()
}

class P6(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3").build()
}
