// lexcode-expect: 0
// Hashing that is the platform's own or is not a password hash: java.security digests, a
// PBKDF2 key factory from the JDK, Apache Commons Codec digests, the PasswordEncoder
// interface itself (using one is not choosing a hash), and a project class named BCrypt
// that lives outside any hashing library.
package demo.accounts;

import demo.legacy.BCrypt;
import java.security.MessageDigest;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

public class Credentials {
  private final PasswordEncoder encoder;

  public Credentials(PasswordEncoder encoder) {
    this.encoder = encoder;
  }

  public boolean matches(String raw, String stored) {
    return encoder.matches(raw, stored);
  }

  public byte[] sha256(String text) throws Exception {
    return MessageDigest.getInstance("SHA-256").digest(text.getBytes());
  }

  public String hex(String text) {
    return DigestUtils.sha256Hex(text);
  }

  public byte[] platformPbkdf2(char[] password, byte[] salt) throws Exception {
    SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
    return factory.generateSecret(new PBEKeySpec(password, salt, 120000, 256)).getEncoded();
  }

  public String legacy(String text) {
    return BCrypt.hashpw(text, BCrypt.gensalt());
  }
}
