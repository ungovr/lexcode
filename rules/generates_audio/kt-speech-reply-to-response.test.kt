// lexcode-expect: 9
package com.example.audio

import org.springframework.scheduling.annotation.Scheduled
import android.media.AudioTrack
import android.media.MediaPlayer
import com.aallam.openai.client.OpenAI
import com.azure.ai.openai.OpenAIClient as AzureOpenAIClient
import com.google.cloud.texttospeech.v1.TextToSpeechClient
import com.microsoft.cognitiveservices.speech.SpeechSynthesizer
import com.openai.client.OpenAIClient
import io.ktor.server.application.call
import io.ktor.server.response.respondBytes
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import jakarta.servlet.http.HttpServletResponse
import org.springframework.ai.audio.tts.TextToSpeechModel
import org.springframework.ai.audio.tts.TextToSpeechPrompt
import org.springframework.ai.openai.audio.speech.SpeechPrompt
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import software.amazon.awssdk.services.polly.PollyClient

@RestController
class SpeechController(
  private val openai: OpenAIClient,
  private val azure: AzureOpenAIClient,
  private val google: TextToSpeechClient,
  private val polly: PollyClient,
  private val springSpeech: TextToSpeechModel,
  private val synthesizer: SpeechSynthesizer,
) {
  // OpenAI Java SDK: the audio is the response body.
  @GetMapping("/speak", produces = ["audio/mpeg"])
  fun speak(@RequestParam text: String): ByteArray =
    openai.audio().speech().create(com.openai.models.audio.speech.SpeechCreateParams.builder().input(text).build()).body().readAllBytes()

  @GetMapping("/azure")
  fun azure(@RequestParam text: String): ResponseEntity<ByteArray> =
    ResponseEntity.ok(azure.generateSpeechFromText("tts-1", null).toBytes())

  // Google Cloud and Amazon Polly.
  @GetMapping("/google")
  fun google(@RequestParam text: String, response: HttpServletResponse) {
    val speech = google.synthesizeSpeech(null, null, null)
    response.outputStream.write(speech.audioContent.toByteArray())
  }

  @GetMapping("/polly")
  fun polly(@RequestParam text: String): ByteArray {
    val speech = polly.synthesizeSpeech(null as software.amazon.awssdk.services.polly.model.SynthesizeSpeechRequest?)
    return speech.readAllBytes()
  }

  // Spring AI and Azure Speech.
  @GetMapping("/spring")
  fun spring(@RequestParam text: String): ByteArray {
    val prompt = SpeechPrompt(text)
    return springSpeech.call(prompt.instructions.toString())
  }

  @GetMapping("/azure-speech")
  fun azureSpeech(@RequestParam text: String): ByteArray = synthesizer.SpeakText(text).audioData
}

// openai-kotlin on an Android screen, played as soon as it is made.
class Narrator(private val openAI: OpenAI) {
  suspend fun narrate(player: MediaPlayer, track: AudioTrack, text: String) {
    val speech = openAI.speech(com.aallam.openai.api.audio.SpeechRequest(model = com.aallam.openai.api.model.ModelId("tts-1"), input = text, voice = com.aallam.openai.api.audio.Voice.Alloy))
    track.write(speech, 0, speech.size)
  }

  suspend fun narrateFile(player: MediaPlayer, text: String) {
    val speech = openAI.speech(com.aallam.openai.api.audio.SpeechRequest(model = com.aallam.openai.api.model.ModelId("tts-1"), input = text, voice = com.aallam.openai.api.audio.Voice.Alloy))
    player.setDataSource(String(speech))
  }
}

fun Route.speechRoutes(google: TextToSpeechClient) {
  get("/speech") {
    val speech = google.synthesizeSpeech(null, null, null)
    call.respondBytes(speech.audioContent.toByteArray())
  }
}

// A function that is not a request handler: a scheduled job returns the model's output to its scheduler.
class Refresher(private val openAI: OpenAI) {
  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return openAI.speech(null).toString()
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = openAI.speech(null).toString()
}
