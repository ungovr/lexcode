// lexcode-expect: 7
// Sending recorded speech to speech-to-text services from Java: Amazon Transcribe (batch
// and streaming), Google Cloud Speech, Azure Speech, the OpenAI Java SDK, AssemblyAI and
// IBM Watson. The Google and Azure imports are wildcards, as many projects write them.
package demo.voice;

import com.assemblyai.api.AssemblyAI;
import com.google.cloud.speech.v1.*;
import com.ibm.watson.speech_to_text.v1.SpeechToText;
import com.microsoft.cognitiveservices.speech.*;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import com.openai.client.OpenAIClient;
import com.openai.models.audio.transcriptions.TranscriptionCreateParams;
import software.amazon.awssdk.services.transcribe.TranscribeClient;
import software.amazon.awssdk.services.transcribe.model.StartTranscriptionJobRequest;
import software.amazon.awssdk.services.transcribestreaming.TranscribeStreamingAsyncClient;
import software.amazon.awssdk.services.transcribestreaming.model.StartStreamTranscriptionRequest;

public class SpeechPipeline {
  private final TranscribeClient transcribe = TranscribeClient.create();
  private final TranscribeStreamingAsyncClient streaming = TranscribeStreamingAsyncClient.create();
  private final OpenAIClient openai;
  private final AssemblyAI assembly;
  private final SpeechToText watson;

  public SpeechPipeline(OpenAIClient openai, AssemblyAI assembly, SpeechToText watson) {
    this.openai = openai;
    this.assembly = assembly;
    this.watson = watson;
  }

  public void batch(String bucketUri) {
    transcribe.startTranscriptionJob(StartTranscriptionJobRequest.builder()
        .transcriptionJobName("voicemail-1")
        .media(m -> m.mediaFileUri(bucketUri))
        .languageCode("en-US")
        .build());
  }

  public void live(StartStreamTranscriptionRequest request, Object publisher, Object handler) {
    streaming.startStreamTranscription(request, null, null);
  }

  public String google(byte[] audio) throws Exception {
    try (SpeechClient speech = SpeechClient.create()) {
      RecognitionConfig config = RecognitionConfig.newBuilder().setLanguageCode("en-US").build();
      RecognitionAudio content = RecognitionAudio.newBuilder().build();
      RecognizeResponse response = speech.recognize(config, content);
      return response.toString();
    }
  }

  public void azure(String key, String region, String path) throws Exception {
    SpeechConfig config = SpeechConfig.fromSubscription(key, region);
    AudioConfig audio = AudioConfig.fromWavFileInput(path);
    SpeechRecognizer recognizer = new SpeechRecognizer(config, audio);
    recognizer.recognizeOnceAsync().get();
  }

  public String whisper(TranscriptionCreateParams params) {
    return openai.audio().transcriptions().create(params).text();
  }

  public void assemblyAi(String url) {
    assembly.transcripts().transcribe(url);
  }

  public void ibm(Object options) {
    watson.recognize(null).execute();
  }
}
