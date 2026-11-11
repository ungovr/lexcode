// lexcode-expect: 0
// Face and image code that finds a face without recognizing anyone: ML Kit face detection
// (boxes and smile probability), the Android FaceDetector that counts faces, OpenCV
// cascade detection that draws a rectangle, and a sharpness filter. Also a local
// FingerprintMatcher that compares file checksums, not fingers.
package demo.faces;

import android.graphics.Bitmap;
import android.media.FaceDetector;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceDetection;
import com.google.mlkit.vision.face.FaceDetectorOptions;
import java.util.List;
import org.opencv.core.Mat;
import org.opencv.core.MatOfRect;
import org.opencv.objdetect.CascadeClassifier;

public class FaceFraming {
  // ML Kit: where the faces are, and whether the person is smiling.
  public void frame(Bitmap bitmap) {
    FaceDetectorOptions options = new FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
        .build();
    com.google.mlkit.vision.face.FaceDetector detector = FaceDetection.getClient(options);
    detector.process(InputImage.fromBitmap(bitmap, 0))
        .addOnSuccessListener(faces -> {
          for (Face face : faces) {
            float smile = face.getSmilingProbability() == null ? 0f : face.getSmilingProbability();
            System.out.println(face.getBoundingBox() + " " + smile);
          }
        });
  }

  public int countFaces(Bitmap rgb565) {
    FaceDetector detector = new FaceDetector(rgb565.getWidth(), rgb565.getHeight(), 5);
    return detector.findFaces(rgb565, new FaceDetector.Face[5]);
  }

  public MatOfRect cascade(Mat gray, CascadeClassifier classifier) {
    MatOfRect faces = new MatOfRect();
    classifier.detectMultiScale(gray, faces);
    return faces;
  }
}

// Compares two files by checksum.
class FingerprintMatcher {
  boolean same(String a, String b) {
    return a.equals(b);
  }
}

class Uploads {
  boolean duplicate(String sha1, String other) {
    return new FingerprintMatcher().same(sha1, other);
  }
}
