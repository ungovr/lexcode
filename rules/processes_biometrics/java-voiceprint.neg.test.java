// lexcode-expect: 0
// Speech and telephony calls that handle a voice without building or matching a
// voiceprint: Amazon Connect outbound contacts, Azure speech recognition and synthesis
// (the transcript is the product, not who is speaking), and local methods named like the
// Voice ID calls.
package demo.voice;

import com.microsoft.cognitiveservices.speech.SpeechConfig;
import com.microsoft.cognitiveservices.speech.SpeechRecognizer;
import com.microsoft.cognitiveservices.speech.SpeechSynthesizer;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import software.amazon.awssdk.services.connect.ConnectClient;
import software.amazon.awssdk.services.connect.model.StartOutboundVoiceContactRequest;

public class ContactDesk {
  private final ConnectClient connect = ConnectClient.create();

  public Object callBack(StartOutboundVoiceContactRequest request) {
    return connect.startOutboundVoiceContact(request);
  }

  public String dictate(String key, String region, String path) throws Exception {
    SpeechConfig config = SpeechConfig.fromSubscription(key, region);
    SpeechRecognizer recognizer = new SpeechRecognizer(config, AudioConfig.fromWavFileInput(path));
    return recognizer.recognizeOnceAsync().get().getText();
  }

  public void speak(String key, String region, String text) throws Exception {
    SpeechConfig config = SpeechConfig.fromSubscription(key, region);
    new SpeechSynthesizer(config).SpeakText(text);
  }

  // Local methods that share names with Voice ID calls.
  void startSpeakerEnrollmentJob(String name) {
    System.out.println("enroll " + name);
  }

  void evaluateSession(String id) {
    System.out.println("session " + id);
  }

  public void run() {
    startSpeakerEnrollmentJob("a");
    evaluateSession("b");
  }
}
