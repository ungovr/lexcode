// lexcode-expect: 2
// The JDK's Cipher and KeyAgreement under a wildcard import of javax.crypto.
package demo.vault;

import java.security.PrivateKey;
import javax.crypto.*;

public class Wildcard {
  public Cipher cipher() throws Exception {
    return Cipher.getInstance("AES/GCM/NoPadding"); // 1
  }

  public KeyAgreement agreement(PrivateKey mine) throws Exception {
    KeyAgreement agreement = KeyAgreement.getInstance("XDH"); // 2
    agreement.init(mine);
    return agreement;
  }
}
