// lexcode-expect: 0
// A file that imports OpenCV and uses only cascade detection, which draws a rectangle around a
// face and names no person.
package demo.faces

import org.opencv.core.Mat
import org.opencv.core.MatOfRect
import org.opencv.objdetect.CascadeClassifier

class Cascade(private val classifier: CascadeClassifier) {
    fun faces(gray: Mat): MatOfRect {
        val faces = MatOfRect()
        classifier.detectMultiScale(gray, faces)
        return faces
    }
}
