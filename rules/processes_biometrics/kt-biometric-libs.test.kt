// lexcode-expect: 7
// Matching faces or fingerprints with a biometric library: the OpenCV face recognizers that
// learn and match identities, the SFace embedder, SourceAFIS (a fingerprint template and the
// matcher, reached by a named import and by a wildcard import in the second fixture), and the
// Neurotechnology biometric client.
package demo.faces

import com.machinezoo.sourceafis.FingerprintImage
import com.machinezoo.sourceafis.FingerprintMatcher
import com.machinezoo.sourceafis.FingerprintTemplate
import com.neurotec.biometrics.client.NBiometricClient
import org.opencv.face.EigenFaceRecognizer
import org.opencv.face.FisherFaceRecognizer
import org.opencv.face.LBPHFaceRecognizer
import org.opencv.objdetect.FaceRecognizerSF

class BiometricMatching {
    fun lbph() = LBPHFaceRecognizer.create()

    fun eigen() = EigenFaceRecognizer.create(80)

    fun fisher() = FisherFaceRecognizer.create()

    fun sface(model: String) = FaceRecognizerSF.create(model, "")

    fun enroll(scan: ByteArray) = FingerprintTemplate(FingerprintImage(scan))

    fun check(probe: FingerprintTemplate) = FingerprintMatcher(probe)

    fun client() = NBiometricClient()
}
