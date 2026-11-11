// lexcode-expect: 0
// Lookalikes in a file that imports no speech vendor: speech-sounding methods on in-house classes and an in-house
// SpeechPrompt. Each one reaches a reply sink, so a rule that matched the bare name would fire.
package com.example.negative.audio

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Clip(val bytes: ByteArray)

interface ReportService {
  fun synthesizeSpeech(id: Long): Clip
  fun generateSpeechFromText(id: Long): Clip
  fun speech(id: Long): Clip
  fun audio(): Library
  fun SpeakText(id: Long): Clip
  fun SpeakSsml(id: Long): Clip
}

interface Library {
  fun speech(): Shelf
}

interface Shelf {
  fun create(id: Long): Clip
}

class SpeechPrompt(val text: String)

@RestController
class ReportController(private val reports: ReportService) {
  @GetMapping("/report/speech")
  fun synth(id: Long): Clip = reports.synthesizeSpeech(id)

  @GetMapping("/report/from-text")
  fun fromText(id: Long): ResponseEntity<Clip> = ResponseEntity.ok(reports.generateSpeechFromText(id))

  @GetMapping("/report/speech2")
  fun speech(id: Long): Clip = reports.speech(id)

  @GetMapping("/report/library")
  fun library(id: Long): Clip = reports.audio().speech().create(id)

  @GetMapping("/report/speak")
  fun speak(id: Long): Clip = reports.SpeakText(id)

  @GetMapping("/report/ssml")
  fun ssml(id: Long): Clip = reports.SpeakSsml(id)

  @GetMapping("/report/prompt")
  fun prompt(): SpeechPrompt {
    val p = SpeechPrompt("hello")
    return p
  }
}
