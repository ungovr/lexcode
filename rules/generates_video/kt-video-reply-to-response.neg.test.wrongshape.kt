// lexcode-expect: 0
// The vendors are imported, but each call is not a generating call (list, count, embed, stop), or its receiver is not a model.
package com.example.negative.video

import com.openai.client.OpenAIClient
import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Acme

@RestController
class H0(private val acme: Acme) {
  @GetMapping("/h0")
  fun reply(x: String): String = acme.videos().list(x)
}

@RestController
class H1(private val acme: Acme) {
  @GetMapping("/h1")
  fun reply(x: String): String = acme.startAsyncInvoke { modelId = "amazon.titan-embed-text-v2:0" }
}

@RestController
class H2(private val acme: Acme) {
  @GetMapping("/h2")
  fun reply(x: String): String = StartAsyncInvokeRequest { modelId = "amazon.titan-embed-text-v2:0" }
}

@RestController
class H3(private val acme: Acme) {
  @GetMapping("/h3")
  fun reply(x: String): String = StartAsyncInvokeRequest.builder().modelId("amazon.titan-embed-text-v2:0").build()
}
