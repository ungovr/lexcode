// lexcode-expect: 8
// Document-and-selfie identity verification: an entity that holds a captured face image beside
// an image of the person's photo ID (as constructor parameters or as properties), an upload
// endpoint or Retrofit call that takes both, and an OkHttp multipart request that sends both
// (one match for each shape).
package demo.verification

import okhttp3.MultipartBody
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.multipart.MultipartFile
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

data class IdentityCheck(val id: Long, val selfieImage: ByteArray, val idDocumentFront: ByteArray)

class IdentityCheckBody {
  var selfieImage: ByteArray? = null
  lateinit var idDocumentFront: ByteArray
  val status: String = "new"
}

class VerificationController {
  @PostMapping("/verify")
  fun verify(
      @RequestPart("selfie") selfie: MultipartFile,
      @RequestPart("idDocument") idDocument: MultipartFile,
  ): String {
    return "received"
  }

  @PostMapping("/verify-again")
  fun verifyAgain(@RequestPart("idDocument") idDocument: MultipartFile, @RequestPart("selfie") selfie: MultipartFile): String = "received"
}

interface VerificationApi {
  @Multipart
  @POST("verify")
  suspend fun submit(@Part selfie: MultipartBody.Part, @Part passportImage: MultipartBody.Part): String
}

class VerificationUpload {
  fun body(face: ByteArray, passport: ByteArray): MultipartBody {
    val builder = MultipartBody.Builder().setType(MultipartBody.FORM)
    builder.addFormDataPart("selfie", "face.jpg", okhttp3.RequestBody.create(null, face))
    builder.addFormDataPart("passport_image", "passport.jpg", okhttp3.RequestBody.create(null, passport))
    return builder.build()
  }

  fun chained(face: ByteArray, licence: ByteArray): MultipartBody =
      MultipartBody.Builder()
          .setType(MultipartBody.FORM)
          .addFormDataPart("liveness", "face.jpg", okhttp3.RequestBody.create(null, face))
          .addFormDataPart("driver_license_front", "licence.jpg", okhttp3.RequestBody.create(null, licence))
          .build()

  fun scoped(face: ByteArray, card: ByteArray): MultipartBody =
      MultipartBody.Builder().apply {
        addFormDataPart("face_image", "face.jpg", okhttp3.RequestBody.create(null, face))
        addFormDataPart("id_card", "card.jpg", okhttp3.RequestBody.create(null, card))
      }.build()
}
