// lexcode-expect: 0
// Image fields and uploads that are not a selfie beside a photo ID: a profile with an avatar and
// a cover photo, a photo-sharing post with a selfie and a receipt, a record that holds only an
// identity document (a form with no face to match), and constants that merely contain the words.
package demo.profile

import okhttp3.MultipartBody
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.multipart.MultipartFile

const val SELFIE_FOLDER = "selfies"

class Profile(val avatarImage: ByteArray, val coverPhoto: ByteArray, val displayName: String) {
  companion object {
    const val ID_CARD_MAX_BYTES = 1000000
  }
}

data class Snap(val selfieImage: ByteArray, val receiptImage: ByteArray, val caption: String)

class SnapBody {
  var selfieImage: ByteArray? = null
  var receiptImage: ByteArray? = null
}

class TaxForm {
  var passportScan: ByteArray? = null
  val taxNumber: String = ""
}

class Folders {
  val SELFIE_FOLDER: String = "selfies"
  val ID_CARD_FRONT: String = "id-card-front"
}

class Uploads {
  fun faceOnly(face: ByteArray): MultipartBody {
    val builder = MultipartBody.Builder().setType(MultipartBody.FORM)
    builder.addFormDataPart("selfie", "face.jpg", okhttp3.RequestBody.create(null, face))
    return builder.build()
  }

  fun documentOnly(card: ByteArray): MultipartBody {
    val builder = MultipartBody.Builder().setType(MultipartBody.FORM)
    builder.addFormDataPart("id_card", "card.jpg", okhttp3.RequestBody.create(null, card))
    return builder.build()
  }

  @PostMapping("/avatar")
  fun avatar(@RequestPart("avatar") avatar: MultipartFile, @RequestPart("cover") cover: MultipartFile): String = "ok"

  @PostMapping("/snap")
  fun snap(@RequestPart("selfie") selfie: MultipartFile, @RequestPart("receipt") receipt: MultipartFile): String {
    return "ok"
  }

  fun avatarBody(face: ByteArray, cover: ByteArray): MultipartBody =
      MultipartBody.Builder()
          .setType(MultipartBody.FORM)
          .addFormDataPart("avatar", "a.jpg", okhttp3.RequestBody.create(null, face))
          .addFormDataPart("cover", "c.jpg", okhttp3.RequestBody.create(null, cover))
          .build()

  fun snapBody(face: ByteArray, receipt: ByteArray): MultipartBody {
    val builder = MultipartBody.Builder().setType(MultipartBody.FORM)
    builder.addFormDataPart("selfie", "face.jpg", okhttp3.RequestBody.create(null, face))
    builder.addFormDataPart("receipt", "receipt.jpg", okhttp3.RequestBody.create(null, receipt))
    return builder.build()
  }
}
