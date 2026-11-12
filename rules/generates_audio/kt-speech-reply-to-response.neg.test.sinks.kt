// lexcode-expect: 0
// Speech synthesized for a file the team opens later, a voicemail played back as it was left, and a transcription (the
// opposite direction), in a file that imports the vendors.
package com.example.negative.audio

import kotlinx.coroutines.runBlocking
import com.aallam.openai.client.OpenAI
import com.azure.ai.openai.OpenAIClient as AzureOpenAIClient
import com.google.cloud.texttospeech.v1.TextToSpeechClient
import com.microsoft.cognitiveservices.speech.SpeechSynthesizer
import jakarta.servlet.http.HttpServletResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import java.io.File
import java.nio.file.Files
import java.nio.file.Path

// bin/narrate: an editor runs it and opens the files it writes.
suspend fun main(openAI: OpenAI, tts: TextToSpeechClient, azure: AzureOpenAIClient, synth: SpeechSynthesizer) {
  val speech = openAI.speech(com.aallam.openai.api.audio.SpeechRequest(model = com.aallam.openai.api.model.ModelId("tts-1"), input = "Hello", voice = com.aallam.openai.api.audio.Voice.Alloy))
  File("hello.mp3").writeBytes(speech)

  val response = tts.synthesizeSpeech(null, null, null)
  File("hello2.mp3").writeBytes(response.audioContent.toByteArray())

  val azureAudio = azure.generateSpeechFromText("tts-1", null)
  File("hello3.mp3").writeBytes(azureAudio.toBytes())

  val result = synth.SpeakText("Hello")
  println(result.reason)
}

@RestController
class VoicemailController(private val boxes: Boxes, private val openAI: OpenAI) {
  // A voicemail played back as it was left: no model made it.
  @GetMapping("/voicemail/{id}")
  fun play(id: String, response: HttpServletResponse) {
    Files.newInputStream(boxes.path(id)).use { it.transferTo(response.outputStream) }
  }

  // A transcription is the opposite direction: speech in, text out.
  @GetMapping("/transcript/{id}")
  suspend fun transcript(id: String): String =
    openAI.transcription(com.aallam.openai.api.audio.TranscriptionRequest(audio = null, model = null)).text
}

interface Boxes {
  fun path(id: String): Path
}

// The last expression of a lambda is not what the handler returns.
@RestController
class BackgroundController(private val openAI: OpenAI) {
  @GetMapping("/background")
  fun background(q: String): String {
    runBlocking { openAI.speech(com.aallam.openai.api.audio.SpeechRequest(model = com.aallam.openai.api.model.ModelId("tts-1"), input = q, voice = com.aallam.openai.api.audio.Voice.Alloy)) }
    return "queued"
  }
}
