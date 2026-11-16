// lexcode-expect: 3
// A JCA cipher through the Bouncy Castle provider by name, with javax.crypto.Cipher fully qualified
// (no import of it). A provider passed as an object is java-platform-encryption's, so the last call
// is not counted here.
package demo.vault;

import org.bouncycastle.jce.provider.BouncyCastleProvider;

public class Qualified {
  public Object byName() throws Exception {
    return javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", "BC"); // 1
  }

  public Object byConstant() throws Exception {
    return javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", BouncyCastleProvider.PROVIDER_NAME); // 2
  }

  public Object byQualifiedConstant() throws Exception {
    return javax.crypto.Cipher.getInstance( // 3
        "AES/GCM/NoPadding", org.bouncycastle.jce.provider.BouncyCastleProvider.PROVIDER_NAME);
  }

  public Object providerObject() throws Exception {
    return javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", new BouncyCastleProvider());
  }
}
