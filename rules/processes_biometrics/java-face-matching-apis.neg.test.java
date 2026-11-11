// lexcode-expect: 0
// Azure Face and image-analysis calls that find a face without recognizing a person: face
// detection returns a box and attributes, image analysis tags a scene, and a Face REST
// call that only detects. Also a local class with identity and verify methods of its own.
package demo.faces;

import com.azure.ai.vision.face.FaceClient;
import com.azure.ai.vision.face.models.FaceDetectionModel;
import com.azure.ai.vision.face.models.FaceDetectionResult;
import com.azure.ai.vision.face.models.FaceRecognitionModel;
import com.azure.core.util.BinaryData;
import java.util.List;

public class FacePresence {
  private final FaceClient client;

  public FacePresence(FaceClient client) {
    this.client = client;
  }

  // Detection only: how many faces and where, matched to no one.
  public int faceCount(byte[] photo) {
    List<FaceDetectionResult> faces = client.detect(
        BinaryData.fromBytes(photo),
        FaceDetectionModel.DETECTION_03,
        FaceRecognitionModel.RECOGNITION_04,
        false);
    return faces.size();
  }

  public String detectEndpoint(String base) {
    return base + "/face/v1.0/detect?returnFaceId=false&returnFaceRectangle=true";
  }

  public String analyzeEndpoint(String base) {
    return base + "/computervision/imageanalysis:analyze?features=tags,caption";
  }
}

// Unrelated code that shares method names.
class Directory {
  boolean verify(String email) {
    return email.contains("@");
  }

  String identity(String name) {
    return name.trim();
  }
}
