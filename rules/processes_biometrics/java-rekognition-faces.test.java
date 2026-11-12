// lexcode-expect: 7
// Recognizing people with Amazon Rekognition from Java: index a face into a collection,
// search a collection by photo or by stored face, compare two photos, search for a user,
// and the SDK v1 client.
package demo.faces;

import com.amazonaws.services.rekognition.*;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.rekognition.RekognitionClient;
import software.amazon.awssdk.services.rekognition.model.CompareFacesRequest;
import software.amazon.awssdk.services.rekognition.model.CompareFacesResponse;
import software.amazon.awssdk.services.rekognition.model.Image;
import software.amazon.awssdk.services.rekognition.model.IndexFacesRequest;
import software.amazon.awssdk.services.rekognition.model.SearchFacesByImageRequest;
import software.amazon.awssdk.services.rekognition.model.SearchFacesRequest;
import software.amazon.awssdk.services.rekognition.model.SearchUsersByImageRequest;

public class FaceDirectory {
  private final RekognitionClient rekognition = RekognitionClient.create();

  private Image image(byte[] bytes) {
    return Image.builder().bytes(SdkBytes.fromByteArray(bytes)).build();
  }

  public Object enroll(String collectionId, byte[] bytes, String personId) {
    return rekognition.indexFaces(IndexFacesRequest.builder()
        .collectionId(collectionId)
        .image(image(bytes))
        .externalImageId(personId)
        .build());
  }

  public Object findPerson(String collectionId, byte[] bytes) {
    return rekognition.searchFacesByImage(SearchFacesByImageRequest.builder()
        .collectionId(collectionId)
        .image(image(bytes))
        .faceMatchThreshold(90f)
        .build());
  }

  public Object knownFace(String collectionId, String faceId) {
    return rekognition.searchFaces(SearchFacesRequest.builder().collectionId(collectionId).faceId(faceId).build());
  }

  public Object userFor(String collectionId, byte[] bytes) {
    return rekognition.searchUsersByImage(SearchUsersByImageRequest.builder().collectionId(collectionId).image(image(bytes)).build());
  }

  public boolean samePerson(byte[] source, byte[] target) {
    CompareFacesResponse reply = rekognition.compareFaces(CompareFacesRequest.builder()
        .sourceImage(image(source))
        .targetImage(image(target))
        .similarityThreshold(90f)
        .build());
    return !reply.faceMatches().isEmpty();
  }

  // The SDK v1 client.
  public Object samePersonV1(com.amazonaws.services.rekognition.model.CompareFacesRequest request) {
    AmazonRekognition client = AmazonRekognitionClientBuilder.defaultClient();
    return client.compareFaces(request);
  }

  public Object videoSearch(Object request) {
    return rekognition.startFaceSearch(null, null);
  }
}
