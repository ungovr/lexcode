// lexcode-expect: 3
// javax.crypto.Cipher fully qualified, with no import of it. A Bouncy Castle provider named by its
// name ("BC" or PROVIDER_NAME) is java-library-encryption's, so those three calls are not counted
// here; a provider passed as an object cannot be told from the JDK's, so those calls are.
package demo.vault;

import java.security.Security;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

public class Providers {
  public Object jdk() throws Exception {
    return javax.crypto.Cipher.getInstance("AES/GCM/NoPadding"); // 1
  }

  public Object providerObject() throws Exception {
    return javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", new BouncyCastleProvider()); // 2
  }

  public Object providerLookup() throws Exception {
    return javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", Security.getProvider("BC")); // 3
  }

  // Bouncy Castle by name: java-library-encryption's, not counted here.
  public Object byName() throws Exception {
    return javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", "BC");
  }

  public Object byConstant() throws Exception {
    return javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", BouncyCastleProvider.PROVIDER_NAME);
  }

  public Object byQualifiedConstant() throws Exception {
    return javax.crypto.Cipher.getInstance(
        "AES/GCM/NoPadding", org.bouncycastle.jce.provider.BouncyCastleProvider.PROVIDER_NAME);
  }
}
