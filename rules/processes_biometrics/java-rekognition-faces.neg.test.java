// lexcode-expect: 0
// Amazon Rekognition calls that look at an image without recognizing a person: label and
// text detection, content moderation, and plain face detection, which finds that a face
// is present and returns its box and attributes but matches it to no one. Also local
// methods named like the matching calls.
package demo.faces;

import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.rekognition.RekognitionClient;
import software.amazon.awssdk.services.rekognition.model.DetectFacesRequest;
import software.amazon.awssdk.services.rekognition.model.DetectLabelsRequest;
import software.amazon.awssdk.services.rekognition.model.DetectModerationLabelsRequest;
import software.amazon.awssdk.services.rekognition.model.DetectTextRequest;
import software.amazon.awssdk.services.rekognition.model.Image;

public class PhotoScreening {
  private final RekognitionClient rekognition = RekognitionClient.create();

  private Image image(byte[] bytes) {
    return Image.builder().bytes(SdkBytes.fromByteArray(bytes)).build();
  }

  public int countFaces(byte[] bytes) {
    return rekognition.detectFaces(DetectFacesRequest.builder().image(image(bytes)).build()).faceDetails().size();
  }

  public Object labels(byte[] bytes) {
    return rekognition.detectLabels(DetectLabelsRequest.builder().image(image(bytes)).build());
  }

  public Object text(byte[] bytes) {
    return rekognition.detectText(DetectTextRequest.builder().image(image(bytes)).build());
  }

  public Object moderation(byte[] bytes) {
    return rekognition.detectModerationLabels(DetectModerationLabelsRequest.builder().image(image(bytes)).build());
  }

  // Local methods that share names with the matching calls.
  public boolean compareFaces(String a, String b) {
    return a.equalsIgnoreCase(b);
  }

  public void check(String a, String b) {
    compareFaces(a, b);
  }
}
