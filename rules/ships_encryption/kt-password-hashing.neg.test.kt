// lexcode-expect: 0
// Password handling that is not a bundled hashing library: the PasswordEncoder interface itself,
// the JDK's MessageDigest and its PBKDF2 SecretKeyFactory, a Commons Codec digest, and a project
// BCrypt class. The BCrypt guard is tested too: this file imports a project BCrypt, not
// jBCrypt's or Favre's.
package demo.auth

import demo.legacy.BCrypt
import java.security.MessageDigest
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import org.apache.commons.codec.digest.DigestUtils
import org.springframework.security.crypto.password.PasswordEncoder

class Passwords(private val encoder: PasswordEncoder) {
  fun check(raw: String, stored: String): Boolean = encoder.matches(raw, stored)

  fun hash(raw: String): String = encoder.encode(raw)

  fun sha(raw: String): ByteArray = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())

  fun pbkdf2(password: CharArray, salt: ByteArray): ByteArray =
      SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(PBEKeySpec(password, salt, 100000, 256)).encoded

  fun commons(raw: String): String = DigestUtils.sha256Hex(raw)

  fun ownBcrypt(raw: String): String = BCrypt.hashpw(raw, "salt")

  fun ownBcryptDefaults(): Any = BCrypt.withDefaults()
}
