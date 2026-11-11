// lexcode-expect: 11
// Hashing passwords with a library the app bundles: Spring Security's BCrypt, Argon2, SCrypt and
// PBKDF2 encoders (constructors and static factories), the delegating encoder, jBCrypt, Favre's
// bcrypt (an import-guarded BCrypt) and argon2-jvm.
package demo.auth

import at.favre.lib.crypto.bcrypt.BCrypt
import de.mkammerer.argon2.Argon2Factory
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.factory.PasswordEncoderFactories
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder
import org.springframework.security.crypto.scrypt.SCryptPasswordEncoder

class Passwords {
  fun bcrypt(): PasswordEncoder = BCryptPasswordEncoder(12)

  fun argon2(): PasswordEncoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()

  fun argon2New(): PasswordEncoder = Argon2PasswordEncoder(16, 32, 1, 1 shl 14, 2)

  fun scrypt(): PasswordEncoder = SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8()

  fun pbkdf2(): PasswordEncoder = Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8()

  fun delegating(): PasswordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder()

  fun favre(raw: String): String = BCrypt.withDefaults().hashToString(12, raw.toCharArray())

  fun favreCost(raw: String): ByteArray = BCrypt.with(BCrypt.Version.VERSION_2A).hash(12, raw.toByteArray())

  fun jbcrypt(raw: String): String = org.mindrot.jbcrypt.BCrypt.hashpw(raw, org.mindrot.jbcrypt.BCrypt.gensalt())

  fun argon(): Any = Argon2Factory.create(Argon2Factory.Argon2Types.ARGON2id)

  fun scryptNew(): PasswordEncoder = SCryptPasswordEncoder(16384, 8, 1, 32, 64)
}
