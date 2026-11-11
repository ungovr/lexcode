// lexcode-expect: 0
// Face and image service calls that find a face or describe an image without recognizing
// anyone: an Azure Face detect endpoint, an image-analysis endpoint, a Face++ detect endpoint,
// and a customer directory whose verify, identity and identify methods have nothing to do with
// a face, with no vendor import. Written as Retrofit annotations and as plain strings.
package demo.faces

import retrofit2.http.Body
import retrofit2.http.POST

interface FaceApi {
    @POST("face/v1.0/detect")
    suspend fun detect(@Body image: ByteArray): List<Any>

    @POST("vision/v3.2/analyze")
    suspend fun analyze(@Body image: ByteArray): Any

    @POST("facepp/v3/detect")
    suspend fun facePlusPlusDetect(@Body image: ByteArray): Any

    @POST("interface/v1.0/verify")
    suspend fun checkInterface(@Body body: Any): Any
}

class Endpoints {
    fun detect(base: String): String = "$base/face/v1.0/detect"

    fun analyze(base: String): String = "$base/computervision/imageanalysis:analyze"

    fun facePlusPlus(): String = "https://api-us.faceplusplus.com/facepp/v3/detect"

    fun voiceItUsers(): String = "https://api.voiceit.io/users/getAllUsers"
}

// A customer directory that shares method names with the matching calls.
class Directory(private val directory: Customers, private val faces: FaceStore) {
    fun lookup(token: String): Any {
        directory.verify(token)
        directory.identity(token)
        directory.findSimilar(token)
        directory.identifyFromPersonGroup(token)
        directory.verifyFaceToFace(token, token)
        directory.verifyFromPersonGroup(token)
        directory.identifyFromLargePersonGroup(token)
        directory.identifyFromDynamicPersonGroup(token)
        directory.verifyFromLargePersonGroup(token)
        directory.findSimilarFromFaceList(token)
        directory.findSimilarFromLargeFaceList(token)
        return faces.detect(token)
    }
}

interface Customers {
    fun verify(token: String)

    fun identity(token: String)

    fun findSimilar(token: String)

    fun identifyFromPersonGroup(token: String)

    fun identifyFromLargePersonGroup(token: String)

    fun identifyFromDynamicPersonGroup(token: String)

    fun verifyFaceToFace(a: String, b: String)

    fun verifyFromPersonGroup(token: String)

    fun verifyFromLargePersonGroup(token: String)

    fun findSimilarFromFaceList(token: String)

    fun findSimilarFromLargeFaceList(token: String)
}

interface FaceStore {
    fun detect(token: String): Any
}
