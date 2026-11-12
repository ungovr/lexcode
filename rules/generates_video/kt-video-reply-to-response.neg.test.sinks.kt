// lexcode-expect: 0
// Video-model calls whose output stays with the team that runs them, and a Bedrock call for a model that is not video.
package com.example.negative.video

import kotlinx.coroutines.runBlocking
import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import com.google.genai.Client
import com.openai.client.OpenAIClient
import com.openai.models.videos.VideoCreateParams
import org.slf4j.LoggerFactory
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.io.File

private val log = LoggerFactory.getLogger("negative")

// bin/storyboard: a producer runs it and watches the files it writes.
suspend fun main(genai: Client, openai: OpenAIClient, bedrock: BedrockRuntimeClient) {
  val operation = genai.models.generateVideos("veo-3.0-generate-001", "A drone shot over a harbor at dawn", null, null)
  log.info("started {}", operation.name().orElse("unnamed"))

  val video = openai.videos().create(VideoCreateParams.builder().prompt("A harbor at dawn").build())
  File("jobs.log").writeText(video.id())

  val job = bedrock.startAsyncInvoke {
    modelId = "amazon.nova-reel-v1:0"
  }
  File("jobs.log").appendText(job.invocationArn)
}

@RestController
class StatusController(private val bedrock: BedrockRuntimeClient) {
  // A Bedrock async call for an embedding model is not a video model, and the id carries no video model's name.
  @GetMapping("/embed")
  suspend fun embed(): String {
    val job = bedrock.startAsyncInvoke {
      modelId = "amazon.titan-embed-text-v2:0"
    }
    return job.invocationArn
  }
}

// The last expression of a lambda is not what the handler returns.
@RestController
class BackgroundController(private val genai: Client) {
  @GetMapping("/background")
  fun background(q: String): String {
    runBlocking { genai.models.generateVideos("veo-3.0-generate-001", q, null, null) }
    return "queued"
  }
}
