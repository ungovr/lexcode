// lexcode-expect: 0
// Calls that sit beside Amazon Rekognition face matching and are not it. Amazon Rekognition
// detection (a face box and attributes, labels, text, moderation) names no person, and the
// Rekognition types are written in full here with no import. A local photo library has
// compareFaces, indexFaces, searchFaces and searchUsers methods of its own and calls them
// on a receiver, which is the shape the matching calls take.
package demo.faces;

public class PhotoScreening {
  private final software.amazon.awssdk.services.rekognition.RekognitionClient rekognition =
      software.amazon.awssdk.services.rekognition.RekognitionClient.create();

  private software.amazon.awssdk.services.rekognition.model.Image image(byte[] bytes) {
    return software.amazon.awssdk.services.rekognition.model.Image.builder()
        .bytes(software.amazon.awssdk.core.SdkBytes.fromByteArray(bytes))
        .build();
  }

  public int countFaces(byte[] bytes) {
    return rekognition
        .detectFaces(software.amazon.awssdk.services.rekognition.model.DetectFacesRequest.builder().image(image(bytes)).build())
        .faceDetails()
        .size();
  }

  public Object labels(byte[] bytes) {
    return rekognition.detectLabels(
        software.amazon.awssdk.services.rekognition.model.DetectLabelsRequest.builder().image(image(bytes)).build());
  }

  public Object moderation(byte[] bytes) {
    return rekognition.detectModerationLabels(
        software.amazon.awssdk.services.rekognition.model.DetectModerationLabelsRequest.builder().image(image(bytes)).build());
  }
}

// A local photo library that shares method names with the matching calls.
class PhotoLibrary {
  private final Library library;

  PhotoLibrary(Library library) {
    this.library = library;
  }

  boolean sameAlbum(String a, String b) {
    return library.compareFaces(a, b);
  }

  void add(String name) {
    library.indexFaces(name);
  }

  Object find(String name) {
    library.searchFaces(name);
    library.searchFacesByImage(name);
    library.searchUsers(name);
    library.searchUsersByImage(name);
    return library.startFaceSearch(name);
  }
}

interface Library {
  boolean compareFaces(String a, String b);

  void indexFaces(String name);

  Object searchFaces(String name);

  Object searchFacesByImage(String name);

  Object searchUsers(String name);

  Object searchUsersByImage(String name);

  Object startFaceSearch(String name);
}
