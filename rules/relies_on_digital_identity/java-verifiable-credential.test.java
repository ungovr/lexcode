// lexcode-expect: 5
// Verifying credentials a person presents from a digital identity wallet: a request to the
// Android wallet for a digital credential, W3C verifiable credentials and presentations read
// with Danubetech, and an SD-JWT credential decoded with Authlete.
package demo.wallet;

import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetDigitalCredentialOption;
import com.authlete.sd.SDJWT;
import com.authlete.sd.SDObjectDecoder;
import com.danubetech.verifiablecredentials.VerifiableCredential;
import com.danubetech.verifiablecredentials.VerifiablePresentation;

public class WalletVerifier {
  public GetCredentialRequest ask(String requestJson) {
    return new GetCredentialRequest.Builder()
        .addCredentialOption(new GetDigitalCredentialOption(requestJson))
        .build();
  }

  public VerifiableCredential readCredential(String json) {
    return VerifiableCredential.fromJson(json);
  }

  public VerifiablePresentation readPresentation(String json) {
    return VerifiablePresentation.fromJson(json);
  }

  public Object readSdJwt(String serialized) {
    SDJWT presented = SDJWT.parse(serialized);
    return new SDObjectDecoder().decode(presented.getCredentialJwtPayload(), presented.getDisclosures());
  }
}
