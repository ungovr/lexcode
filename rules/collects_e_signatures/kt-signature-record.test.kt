// lexcode-expect: 5
// A signature a person drew or captured, stored on the record of an agreement, waiver or
// consent: a waiver with a signature image (as a constructor property), a lease with the
// tenant's signature (as a body property), a consent form whose field is a base64 signature
// (set later), a Room entity, and a nested class inside a consent controller.
package demo.records

import androidx.room.Entity

data class EventWaiver(val participantName: String, val signatureImage: ByteArray)

class LeaseAgreement {
  var unit: String = ""
  var tenantSignature: ByteArray? = null
}

class PhotoReleaseForm {
  lateinit var signature: String
  var signedAt: Long = 0
}

@Entity
data class ConsentRecord(val id: Long, val signatureBase64: String?)

class ConsentController {
  class ConsentRequest(val guardianSignature: String, val childName: String)
}
