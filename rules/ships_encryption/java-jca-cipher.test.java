// lexcode-expect: 3
// Application-level encryption with the JCA: an AES-GCM cipher for a field, an RSA cipher that
// wraps a key, and an ECDH key agreement.
package demo.crypto;

import java.security.Key;
import java.security.PublicKey;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class FieldCrypto {
  public byte[] encryptField(SecretKey key, byte[] iv, byte[] plain) throws Exception {
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
    return cipher.doFinal(plain);
  }

  public byte[] wrap(PublicKey publicKey, Key sessionKey) throws Exception {
    Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    rsa.init(Cipher.WRAP_MODE, publicKey);
    return rsa.wrap(sessionKey);
  }

  public byte[] agree(java.security.PrivateKey mine, PublicKey theirs) throws Exception {
    KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
    agreement.init(mine);
    agreement.doPhase(theirs, true);
    return agreement.generateSecret();
  }
}
