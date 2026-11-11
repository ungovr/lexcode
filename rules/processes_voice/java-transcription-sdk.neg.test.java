// lexcode-expect: 0
// Speech synthesis and text-only calls that sit beside speech recognition and are not it:
// Polly, Azure and Google reading typed text aloud, and local classes with a recognize or
// startTranscriptionJob method of their own.
package demo.voice;

import com.google.cloud.texttospeech.v1.SynthesisInput;
import com.google.cloud.texttospeech.v1.TextToSpeechClient;
import com.microsoft.cognitiveservices.speech.SpeechConfig;
import com.microsoft.cognitiveservices.speech.SpeechSynthesizer;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechRequest;

public class Narrator {
  private final PollyClient polly = PollyClient.create();

  // Typed text goes in; synthetic audio comes out. No person's voice is an input.
  public byte[] readAloud(String text) {
    SynthesizeSpeechRequest request = SynthesizeSpeechRequest.builder()
        .text(text)
        .voiceId("Joanna")
        .outputFormat("mp3")
        .build();
    return polly.synthesizeSpeech(request).readAllBytes();
  }

  public void azureSpeak(String key, String region, String text) throws Exception {
    SpeechConfig config = SpeechConfig.fromSubscription(key, region);
    SpeechSynthesizer synthesizer = new SpeechSynthesizer(config);
    synthesizer.SpeakText(text);
  }

  public void googleSpeak(String text) throws Exception {
    try (TextToSpeechClient client = TextToSpeechClient.create()) {
      SynthesisInput input = SynthesisInput.newBuilder().setText(text).build();
      client.synthesizeSpeech(input, null, null);
    }
  }
}

// A local archive with transcription-sounding names and no speech vendor behind them.
class MinutesIndex {
  private final Archive archive;

  MinutesIndex(Archive archive) {
    this.archive = archive;
  }

  void rebuild(String name) {
    archive.startTranscriptionJob(name);
    archive.recognize(name, "en");
    archive.transcribe(name);
  }
}

interface Archive {
  void startTranscriptionJob(String name);

  void recognize(String name, String language);

  void transcribe(String name);
}
