// lexcode-expect: 4
// The same libraries through wildcard imports, with JavaCV's package for the OpenCV recognizers.
package demo.faces

import com.machinezoo.sourceafis.*
import com.neurotec.biometrics.client.*
import org.bytedeco.opencv.opencv_face.*

class WildcardMatching {
    fun lbph() = LBPHFaceRecognizer.create()

    fun enroll(scan: ByteArray) = FingerprintTemplate(FingerprintImage(scan))

    fun check(probe: FingerprintTemplate) = FingerprintMatcher(probe)

    fun client() = NBiometricClient()
}
