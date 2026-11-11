// lexcode-expect: 0
// Azure Face and image-analysis calls that find a face without recognizing a person: face
// detection returns a box and attributes, image analysis tags a scene, and a Face REST
// URL that only detects. The Azure types are written in full with no import. A local
// directory has identifyFromPersonGroup, verifyFaceToFace, findSimilar, identity and
// verify methods of its own and calls them on a receiver, the shape the Azure calls take.
package demo.faces;

import java.util.List;

public class FacePresence {
  private final com.azure.ai.vision.face.FaceClient client;

  public FacePresence(com.azure.ai.vision.face.FaceClient client) {
    this.client = client;
  }

  // Detection only: how many faces and where, matched to no one.
  public int faceCount(byte[] photo) {
    List<com.azure.ai.vision.face.models.FaceDetectionResult> faces = client.detect(
        com.azure.core.util.BinaryData.fromBytes(photo),
        com.azure.ai.vision.face.models.FaceDetectionModel.DETECTION_03,
        com.azure.ai.vision.face.models.FaceRecognitionModel.RECOGNITION_04,
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

// An unrelated staff directory that shares method names with the matching calls.
class StaffDirectory {
  private final Directory directory;

  StaffDirectory(Directory directory) {
    this.directory = directory;
  }

  void lookUp(String email, String group) {
    directory.identifyFromPersonGroup(email, group);
    directory.identifyFromLargePersonGroup(email, group);
    directory.identifyFromDynamicPersonGroup(email, group);
    directory.verifyFaceToFace(email, group);
    directory.verifyFromPersonGroup(email, group);
    directory.verifyFromLargePersonGroup(email, group);
    directory.findSimilar(email, group);
    directory.findSimilarFromFaceList(email, group);
    directory.findSimilarFromLargeFaceList(email, group);
    directory.verify(email);
    directory.identity(email);
  }
}

interface Directory {
  void identifyFromPersonGroup(String a, String b);

  void identifyFromLargePersonGroup(String a, String b);

  void identifyFromDynamicPersonGroup(String a, String b);

  void verifyFaceToFace(String a, String b);

  void verifyFromPersonGroup(String a, String b);

  void verifyFromLargePersonGroup(String a, String b);

  void findSimilar(String a, String b);

  void findSimilarFromFaceList(String a, String b);

  void findSimilarFromLargeFaceList(String a, String b);

  boolean verify(String email);

  String identity(String name);
}
