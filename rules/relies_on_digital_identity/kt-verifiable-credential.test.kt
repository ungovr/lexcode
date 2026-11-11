// lexcode-expect: 5
// Verifying credentials a person presents from a digital identity wallet: a request to the
// Android wallet for a digital credential, W3C verifiable credentials and presentations read
// with Danubetech, and an SD-JWT credential decoded with Authlete.
package demo.wallet

import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetDigitalCredentialOption
import com.authlete.sd.SDJWT
import com.authlete.sd.SDObjectDecoder
import com.danubetech.verifiablecredentials.VerifiableCredential
import com.danubetech.verifiablecredentials.VerifiablePresentation

class WalletVerifier {
  fun ask(requestJson: String): GetCredentialRequest =
      GetCredentialRequest(listOf(GetDigitalCredentialOption(requestJson)))

  fun readCredential(json: String): VerifiableCredential = VerifiableCredential.fromJson(json)

  fun readPresentation(json: String): VerifiablePresentation = VerifiablePresentation.fromJson(json)

  fun readSdJwt(serialized: String): Any {
    val presented = SDJWT.parse(serialized)
    return SDObjectDecoder().decode(presented.credentialJwtPayload, presented.disclosures)
  }
}
