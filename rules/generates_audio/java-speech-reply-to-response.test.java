// lexcode-expect: 6
package com.example.audio;

import com.azure.ai.openai.OpenAIClient;
import com.google.cloud.texttospeech.v1.SynthesizeSpeechResponse;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.microsoft.cognitiveservices.speech.SpeechSynthesisResult;
import com.microsoft.cognitiveservices.speech.SpeechSynthesizer;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.polly.PollyClient;

@RestController
public class VoiceController {
  private final com.openai.client.OpenAIClient openai;
  private final TextToSpeechClient google;
  private final PollyClient polly;
  private final SpeechSynthesizer azureSpeech;
  private final TextToSpeechModel springTts;

  public VoiceController(com.openai.client.OpenAIClient openai, TextToSpeechClient google, PollyClient polly,
      SpeechSynthesizer azureSpeech, TextToSpeechModel springTts) {
    this.openai = openai;
    this.google = google;
    this.polly = polly;
    this.azureSpeech = azureSpeech;
    this.springTts = springTts;
  }

  // The narration the model speaks is the response.
  @PostMapping("/narrate")
  public ResponseEntity<byte[]> narrate(@RequestParam String text) throws IOException {
    var speech = openai.audio().speech().create(
        com.openai.models.audio.speech.SpeechCreateParams.builder()
            .model("gpt-4o-mini-tts")
            .voice("alloy")
            .input(text)
            .build());
    return ResponseEntity.ok().contentType(MediaType.valueOf("audio/mpeg")).body(speech.body().readAllBytes());
  }

  @GetMapping("/google")
  public ResponseEntity<byte[]> viaGoogle(@RequestParam String text) {
    SynthesizeSpeechResponse response = google.synthesizeSpeech(null, null, null);
    return ResponseEntity.ok(response.getAudioContent().toByteArray());
  }

  public void viaPolly(String text, HttpServletResponse resp) throws IOException {
    var audio = polly.synthesizeSpeech(r -> r.text(text).voiceId("Joanna").outputFormat("mp3"));
    resp.getOutputStream().write(audio.audioStream().readAllBytes());
  }

  @GetMapping("/azure")
  public byte[] viaAzure(@RequestParam String text) throws Exception {
    SpeechSynthesisResult result = azureSpeech.SpeakTextAsync(text).get();
    return result.getAudioData();
  }

  @GetMapping("/spring")
  public byte[] viaSpring(@RequestParam String text) {
    return springTts.call(text);
  }

  // A mobile screen plays the narration.
  public static class NarrationActivity extends android.app.Activity {
    private android.media.AudioTrack track;
    private TextToSpeechClient client;

    void speak(String text) {
      SynthesizeSpeechResponse response = client.synthesizeSpeech(null, null, null);
      byte[] audio = response.getAudioContent().toByteArray();
      track.write(audio, 0, audio.length);
    }
  }
}
