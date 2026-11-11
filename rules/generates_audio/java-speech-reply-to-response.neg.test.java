// lexcode-expect: 0
// Speech-model calls whose output stays with the team that runs them, and recordings a person made that the app only plays or transcribes.
package com.example.negative.audio;

import com.google.cloud.texttospeech.v1.SynthesizeSpeechResponse;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.openai.client.OpenAIClient;
import com.openai.models.audio.transcriptions.TranscriptionCreateParams;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

public class NarrationJob {
  private static final Logger log = LoggerFactory.getLogger(NarrationJob.class);

  // bin/narrate: an editor runs it and listens to the files it writes.
  public static void main(String[] args) throws Exception {
    try (TextToSpeechClient tts = TextToSpeechClient.create()) {
      SynthesizeSpeechResponse response = tts.synthesizeSpeech(null, null, null);
      Files.write(Path.of("intro.mp3"), response.getAudioContent().toByteArray());
      log.info("wrote intro.mp3");
    }
    OpenAIClient openai = com.openai.client.okhttp.OpenAIOkHttpClient.fromEnv();
    var speech = openai.audio().speech().create(
        com.openai.models.audio.speech.SpeechCreateParams.builder()
            .model("gpt-4o-mini-tts")
            .voice("alloy")
            .input("Welcome to the show.")
            .build());
    try (InputStream body = speech.body()) {
      Files.copy(body, Path.of("welcome.mp3"));
    }
  }

  // Recordings a person made are played back or transcribed, not generated.
  @RestController
  public static class VoicemailController {
    private final OpenAIClient openai;
    private final VoicemailStore store;

    public VoicemailController(OpenAIClient openai, VoicemailStore store) {
      this.openai = openai;
      this.store = store;
    }

    @GetMapping("/voicemail/{id}")
    public void play(@RequestParam String id, HttpServletResponse resp) throws IOException {
      try (InputStream in = Files.newInputStream(store.path(id))) {
        in.transferTo(resp.getOutputStream());
      }
    }

    @PostMapping("/transcribe")
    public ResponseEntity<String> transcribe(@RequestParam MultipartFile file) throws IOException {
      var transcription = openai.audio().transcriptions().create(
          TranscriptionCreateParams.builder().model("whisper-1").file(file.getBytes()).build());
      return ResponseEntity.ok(transcription.asTranscription().text());
    }
  }
}

// An in-house report service whose method name sounds like a speech-model call. It renders a written report.
@RestController
class ReportController {
  private final ReportService reports;

  ReportController(ReportService reports) {
    this.reports = reports;
  }

  @GetMapping("/reports/{id}")
  public ResponseEntity<String> report(@RequestParam String id) {
    String text = reports.synthesizeSpeech(id);
    return ResponseEntity.ok(text);
  }

  @GetMapping("/reports/{id}/raw")
  public String raw(@RequestParam String id) {
    return reports.synthesizeSpeech(id);
  }
}
