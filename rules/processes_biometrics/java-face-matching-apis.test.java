// lexcode-expect: 6
// Recognizing people with face matching services from Java: Azure Face identification,
// verification and similarity search through the SDK, and the Face REST, Face++ and
// VoiceIt endpoints named in strings.
package demo.faces;

import com.azure.ai.vision.face.FaceClient;
import com.azure.core.util.BinaryData;
import java.util.List;
import java.util.UUID;

public class FaceMatching {
  private final FaceClient client;

  public FaceMatching(FaceClient client) {
    this.client = client;
  }

  public Object whoIsThis(List<UUID> faceIds, String groupId) {
    return client.identifyFromPersonGroup(faceIds, groupId);
  }

  public Object sameFace(UUID a, UUID b) {
    return client.verifyFaceToFace(a, b);
  }

  public Object lookalikes(UUID faceId, List<UUID> candidates) {
    return client.findSimilar(faceId, candidates);
  }

  public String identifyEndpoint(String base) {
    return base + "/face/v1.0/identify";
  }

  public String facePlusPlus() {
    return "https://api-us.faceplusplus.com/facepp/v3/compare";
  }

  public String voiceprint() {
    return "https://api.voiceit.io/verification/byVoice";
  }
}
