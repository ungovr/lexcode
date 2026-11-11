// lexcode-expect: 8
// Recognizing people with biometric libraries that run in the app: OpenCV face
// recognizers (LBPH, Eigenfaces, Fisherfaces and the SFace embedder), SourceAFIS
// fingerprint templates and matching, and the Neurotechnology biometric client.
package demo.faces;

import com.machinezoo.sourceafis.FingerprintImage;
import com.machinezoo.sourceafis.FingerprintMatcher;
import com.machinezoo.sourceafis.FingerprintTemplate;
import com.neurotec.biometrics.client.NBiometricClient;
import org.opencv.face.EigenFaceRecognizer;
import org.opencv.face.FisherFaceRecognizer;
import org.opencv.face.LBPHFaceRecognizer;
import org.opencv.objdetect.FaceRecognizerSF;

public class BiometricMatching {
  public Object lbph() {
    return LBPHFaceRecognizer.create();
  }

  public Object eigen() {
    return EigenFaceRecognizer.create(10);
  }

  public Object fisher() {
    return FisherFaceRecognizer.create();
  }

  public Object sface(String model) {
    return FaceRecognizerSF.create(model, "");
  }

  public double match(byte[] probeScan, byte[] candidateScan) {
    FingerprintTemplate probe = new FingerprintTemplate(new FingerprintImage(probeScan));
    FingerprintTemplate candidate = new FingerprintTemplate(new FingerprintImage(candidateScan));
    return new FingerprintMatcher(probe).match(candidate);
  }

  public NBiometricClient client() {
    return new NBiometricClient();
  }
}
