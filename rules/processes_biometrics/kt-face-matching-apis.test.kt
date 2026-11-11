// lexcode-expect: 9
// Recognizing people with face matching services from Kotlin: Azure Face identification,
// verification and similarity search through the SDK, the older Face client on Android, and
// the Face REST, Face++ and VoiceIt endpoints named in strings and Retrofit annotations.
package demo.faces

import com.azure.ai.vision.face.FaceClient
import com.microsoft.projectoxford.face.FaceServiceClient
import java.util.UUID
import retrofit2.http.Body
import retrofit2.http.POST

class FaceMatching(private val client: FaceClient, private val legacy: FaceServiceClient) {
    fun whoIsThis(faceIds: List<UUID>, groupId: String): Any = client.identifyFromPersonGroup(faceIds, groupId)

    fun sameFace(a: UUID, b: UUID): Any = client.verifyFaceToFace(a, b)

    fun lookalikes(faceId: UUID, candidates: List<UUID>): Any = client.findSimilar(faceId, candidates)

    fun legacyIdentify(groupId: String, faceIds: Array<UUID>): Any = legacy.identity(groupId, faceIds, 1)

    fun legacyVerify(a: UUID, b: UUID): Any = legacy.verify(a, b)

    fun identifyEndpoint(base: String): String = "$base/face/v1.0/identify"

    fun facePlusPlus(): String = "https://api-us.faceplusplus.com/facepp/v3/compare"

    fun voiceprint(): String = "https://api.voiceit.io/verification/byVoice"
}

interface FaceApi {
    @POST("face/v1.0/verify")
    suspend fun verify(@Body body: Any): Any
}
