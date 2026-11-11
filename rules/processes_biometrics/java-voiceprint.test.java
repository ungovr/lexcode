// lexcode-expect: 6
// Enrolling and matching a speaker's voiceprint from Java: Amazon Connect Voice ID
// (speaker enrollment, fraudster registration, session evaluation) and Azure Speech
// speaker verification and identification.
package demo.voice;

import com.microsoft.cognitiveservices.speech.speaker.SpeakerIdentificationModel;
import com.microsoft.cognitiveservices.speech.speaker.SpeakerRecognizer;
import com.microsoft.cognitiveservices.speech.speaker.SpeakerVerificationModel;
import com.microsoft.cognitiveservices.speech.speaker.VoiceProfile;
import com.microsoft.cognitiveservices.speech.speaker.VoiceProfileClient;
import java.util.List;
import software.amazon.awssdk.services.voiceid.*;
import software.amazon.awssdk.services.voiceid.model.EvaluateSessionRequest;
import software.amazon.awssdk.services.voiceid.model.StartFraudsterRegistrationJobRequest;
import software.amazon.awssdk.services.voiceid.model.StartSpeakerEnrollmentJobRequest;

public class VoiceAuth {
  private final VoiceIdClient voiceId = VoiceIdClient.create();

  public Object enroll(StartSpeakerEnrollmentJobRequest request) {
    return voiceId.startSpeakerEnrollmentJob(request);
  }

  public Object registerFraudster(StartFraudsterRegistrationJobRequest request) {
    return voiceId.startFraudsterRegistrationJob(request);
  }

  public Object evaluate(EvaluateSessionRequest request) {
    return voiceId.evaluateSession(request);
  }

  public SpeakerVerificationModel verifyModel(VoiceProfile profile) {
    return SpeakerVerificationModel.fromProfile(profile);
  }

  public SpeakerIdentificationModel identifyModel(List<VoiceProfile> profiles) {
    return SpeakerIdentificationModel.fromProfiles(profiles);
  }

  public VoiceProfileClient profiles(com.microsoft.cognitiveservices.speech.SpeechConfig config) {
    return new VoiceProfileClient(config);
  }
}
