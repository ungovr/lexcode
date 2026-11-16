// lexcode-expect: 7
// Encryption and key agreement through the JDK's own cryptography: a javax.crypto Cipher with the
// default provider, a named JDK provider and the Android Keystore, and a KeyAgreement for ECDH and
// X25519, imported, fully qualified, and split over lines. A cipher built through the Bouncy Castle
// provider is java-library-encryption's, so the two calls that name it are not counted here.
package demo.vault;

import java.security.PrivateKey;
import java.security.PublicKey;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.SecretKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;

public class Sealer {
  public byte[] seal(SecretKey key, byte[] plain) throws Exception {
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); // 1
    cipher.init(Cipher.ENCRYPT_MODE, key);
    return cipher.doFinal(plain);
  }

  public Cipher fromTheJdkProvider() throws Exception {
    return Cipher.getInstance("AES/CBC/PKCS5Padding", "SunJCE"); // 2
  }

  public Cipher keystoreWrap() throws Exception {
    return Cipher.getInstance( // 3
        "RSA/ECB/OAEPWithSHA-256AndMGF1Padding",
        "AndroidKeyStoreBCWorkaround");
  }

  public Cipher qualified() throws Exception {
    return javax.crypto.Cipher.getInstance("ChaCha20-Poly1305"); // 4
  }

  public byte[] agree(PrivateKey mine, PublicKey theirs) throws Exception {
    KeyAgreement agreement = KeyAgreement.getInstance("ECDH"); // 5
    agreement.init(mine);
    agreement.doPhase(theirs, true);
    return agreement.generateSecret();
  }

  public KeyAgreement x25519() throws Exception {
    return javax.crypto.KeyAgreement.getInstance("X25519"); // 6
  }

  public Cipher legacy() throws Exception {
    return Cipher
        .getInstance("DESede/CBC/PKCS5Padding"); // 7
  }

  // Through the Bouncy Castle provider: java-library-encryption's, not counted here.
  public Cipher bouncy() throws Exception {
    return Cipher.getInstance("AES/GCM/NoPadding", "BC");
  }

  public Cipher bouncyByName() throws Exception {
    return Cipher.getInstance("AES/GCM/NoPadding", BouncyCastleProvider.PROVIDER_NAME);
  }
}
