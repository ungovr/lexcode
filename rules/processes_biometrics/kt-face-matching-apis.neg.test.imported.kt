// lexcode-expect: 0
// A file that imports the Azure Face client and the older Face service client and only
// detects faces (where they are, whether they are blurred), which names no person.
package demo.faces

import com.azure.ai.vision.face.FaceClient
import com.microsoft.projectoxford.face.FaceServiceClient

class Framing(private val faceClient: FaceClient, private val legacy: FaceServiceClient) {
    fun count(image: ByteArray): Int = faceClient.detect(image, null, null).size

    fun legacyCount(image: java.io.InputStream): Int = legacy.detect(image, true, false, null).size
}
