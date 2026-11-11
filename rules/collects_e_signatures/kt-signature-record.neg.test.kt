// lexcode-expect: 0
// A signature that is not a person signing an agreement: a webhook's HMAC signature, a release
// artifact's checksum signature, an email signature block on a user profile, a JWT's signature
// part, an agreement entity whose fields are not a signature (its status and its text), and
// agreement words that only start a longer word (a contractor and a leaseholder).
package demo.records

import androidx.room.Entity

data class WebhookEvent(val signature: String, val payload: String)

class ReleaseArtifact {
  var signature: ByteArray? = null
  val version: String = ""
}

data class UserProfile(val emailSignature: String, val displayName: String)

class JwtParts(val header: String, val payload: String, val signature: String)

@Entity
data class ServiceAgreement(val status: String, val termsText: String, val effectiveOn: Long)

data class AgreementWebhook(val signatureHeader: String, val payload: String)

data class ContractorProfile(val signature: String, val name: String)

class Leaseholder {
  var signatureImage: String? = null
}
