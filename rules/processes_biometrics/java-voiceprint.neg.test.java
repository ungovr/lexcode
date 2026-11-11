// lexcode-expect: 0
// Speech and telephony calls that handle a voice without building or matching a
// voiceprint: Amazon Connect outbound contacts and Azure speech recognition and synthesis
// (the transcript is the product, not who is speaking), with the vendor types written in
// full and no import. A local contact desk has startSpeakerEnrollmentJob,
// startFraudsterRegistrationJob and evaluateSession methods of its own and calls them on a
// receiver, the shape the Voice ID calls take.
package demo.voice;

public class ContactDesk {
  private final software.amazon.awssdk.services.connect.ConnectClient connect =
      software.amazon.awssdk.services.connect.ConnectClient.create();

  public Object callBack(software.amazon.awssdk.services.connect.model.StartOutboundVoiceContactRequest request) {
    return connect.startOutboundVoiceContact(request);
  }

  public String dictate(String key, String region, String path) throws Exception {
    com.microsoft.cognitiveservices.speech.SpeechConfig config =
        com.microsoft.cognitiveservices.speech.SpeechConfig.fromSubscription(key, region);
    com.microsoft.cognitiveservices.speech.SpeechRecognizer recognizer =
        new com.microsoft.cognitiveservices.speech.SpeechRecognizer(
            config, com.microsoft.cognitiveservices.speech.audio.AudioConfig.fromWavFileInput(path));
    return recognizer.recognizeOnceAsync().get().getText();
  }

  public void speak(String key, String region, String text) throws Exception {
    com.microsoft.cognitiveservices.speech.SpeechConfig config =
        com.microsoft.cognitiveservices.speech.SpeechConfig.fromSubscription(key, region);
    new com.microsoft.cognitiveservices.speech.SpeechSynthesizer(config).SpeakText(text);
  }
}

// A local queue that shares method names with the Voice ID calls.
class HelpQueue {
  private final Desk desk;

  HelpQueue(Desk desk) {
    this.desk = desk;
  }

  void run(String name) {
    desk.startSpeakerEnrollmentJob(name);
    desk.startFraudsterRegistrationJob(name);
    desk.evaluateSession(name);
  }
}

interface Desk {
  void startSpeakerEnrollmentJob(String name);

  void startFraudsterRegistrationJob(String name);

  void evaluateSession(String id);
}
