// lexcode-expect: 0
// Face and image code that finds a face without recognizing anyone: ML Kit face detection
// (boxes and smile probability) on a CameraX analyzer, and the Android FaceDetector that counts
// faces. Also a local FingerprintMatcher, FingerprintTemplate and NBiometricClient that handle
// file checksums and cache keys, not fingers, and recognizer-named helpers of a photo app,
// with no OpenCV, SourceAFIS or Neurotechnology import.
package demo.faces

import android.graphics.Bitmap
import android.media.FaceDetector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions

class FaceFraming {
    // ML Kit: where the faces are, and whether the person is smiling.
    fun frame(bitmap: Bitmap) {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .build()
        val detector = FaceDetection.getClient(options)
        detector.process(InputImage.fromBitmap(bitmap, 0)).addOnSuccessListener { faces ->
            for (face in faces) {
                println("${face.boundingBox} ${face.smilingProbability ?: 0f}")
            }
        }
    }

    fun analyzer(): ImageAnalysis.Analyzer =
        ImageAnalysis.Analyzer { proxy: ImageProxy ->
            val image = InputImage.fromMediaImage(proxy.image!!, proxy.imageInfo.rotationDegrees)
            FaceDetection.getClient().process(image).addOnCompleteListener { proxy.close() }
        }

    fun countFaces(rgb565: Bitmap): Int {
        val detector = FaceDetector(rgb565.width, rgb565.height, 5)
        return detector.findFaces(rgb565, arrayOfNulls(5))
    }
}

// Compares two files by checksum.
class FingerprintMatcher {
    fun same(a: String, b: String): Boolean = a == b
}

class FingerprintTemplate(val name: String)

class NBiometricClient

class Uploads {
    fun duplicate(sha1: String, other: String): Boolean = FingerprintMatcher().same(sha1, other)

    fun stamp(name: String): Any = FingerprintTemplate(name)

    fun client(): Any = NBiometricClient()
}

// Helpers of a photo app that share names with the OpenCV recognizers.
object LBPHFaceRecognizer {
    fun create(radius: Int): String = "lbph-$radius"
}

object EigenFaceRecognizer {
    fun create(components: Int): String = "eigen-$components"
}

object FisherFaceRecognizer {
    fun create(components: Int): String = "fisher-$components"
}

object FaceRecognizerSF {
    fun create(model: String, config: String): String = "$model$config"
}

fun helpers(): List<String> =
    listOf(LBPHFaceRecognizer.create(1), EigenFaceRecognizer.create(2), FisherFaceRecognizer.create(3), FaceRecognizerSF.create("m", "c"))
