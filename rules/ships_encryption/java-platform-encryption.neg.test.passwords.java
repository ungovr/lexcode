// lexcode-expect: 0
// Password hashing is not shipping encryption, from a bundled library or not: Spring Security's
// bcrypt, Argon2, scrypt and PBKDF2 encoders and its delegating encoder factory, jBCrypt, bcrypt by
// Favre, argon2-jvm, and a Commons Codec digest.
package demo.accounts;

import at.favre.lib.crypto.bcrypt.BCrypt;
import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder;

public class Hashing {
  public PasswordEncoder bcrypt() {
    return new BCryptPasswordEncoder(12);
  }

  public PasswordEncoder argon() {
    return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
  }

  public PasswordEncoder scrypt() {
    return SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8();
  }

  public PasswordEncoder delegating() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }

  public String jbcrypt(String password) {
    return org.mindrot.jbcrypt.BCrypt.hashpw(password, org.mindrot.jbcrypt.BCrypt.gensalt());
  }

  public String favre(char[] password) {
    return BCrypt.withDefaults().hashToString(12, password);
  }

  public Argon2 argonJvm() {
    return Argon2Factory.create();
  }

  public PasswordEncoder pbkdf2() {
    return new Pbkdf2PasswordEncoder("secret", 16, 310000, 256);
  }

  public String hex(String text) {
    return DigestUtils.sha256Hex(text);
  }
}
