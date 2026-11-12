// lexcode-expect: 6
package com.example.video

import org.springframework.scheduling.annotation.Scheduled
import android.widget.VideoView
import androidx.media3.exoplayer.ExoPlayer
import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import com.google.genai.Client
import com.openai.client.OpenAIClient
import com.openai.models.videos.VideoCreateParams
import io.ktor.server.application.call
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class VideoController(
  private val genai: Client,
  private val openai: OpenAIClient,
  private val bedrock: BedrockRuntimeClient,
) {
  // Veo: the operation is returned to the client that polls for the clip.
  @GetMapping("/veo")
  fun veo(@RequestParam prompt: String): String {
    val operation = genai.models.generateVideos("veo-3.0-generate-001", prompt, null, null)
    return operation.name().orElse("")
  }

  // OpenAI Sora.
  @GetMapping("/sora")
  fun sora(@RequestParam prompt: String): ResponseEntity<String> =
    ResponseEntity.ok(openai.videos().create(VideoCreateParams.builder().prompt(prompt).build()).id())

  // Bedrock Nova Reel.
  @GetMapping("/reel")
  suspend fun reel(@RequestParam prompt: String): String {
    val job = bedrock.startAsyncInvoke {
      modelId = "amazon.nova-reel-v1:0"
    }
    return job.invocationArn
  }
}

// On a phone: the clip is played as soon as it is made.
class ClipScreen(private val genai: Client, private val openai: OpenAIClient) {
  fun play(view: VideoView, prompt: String) {
    val operation = genai.models.generateVideos("veo-3.0-generate-001", prompt, null, null)
    view.setVideoPath(operation.name().orElse(""))
  }

  fun playSora(player: ExoPlayer, prompt: String) {
    val video = openai.videos().createAndPoll(VideoCreateParams.builder().prompt(prompt).build())
    player.setMediaItem(androidx.media3.common.MediaItem.fromUri(video.id()))
  }
}

fun Route.videoRoutes(genai: Client) {
  get("/video") {
    val operation = genai.models.generateVideos("veo-3.0-generate-001", "A harbor", null, null)
    call.respond(operation.name().orElse(""))
  }
}

// A function that is not a request handler: a scheduled job returns the model's output to its scheduler.
class Refresher(private val genai: Client) {
  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return genai.models.generateVideos("veo-3.0-generate-001", "status", null, null).name().orElse("")
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = genai.models.generateVideos("veo-3.0-generate-001", "status", null, null).name().orElse("")
}
