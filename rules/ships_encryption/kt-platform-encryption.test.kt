// lexcode-expect: 7
// Encryption and key agreement through the platform's own cryptography: a javax.crypto Cipher with
// the default provider, a named JDK provider and an Android Keystore key, and a KeyAgreement for
// ECDH and X25519, imported, fully qualified, and split over lines. A cipher built through the
// Bouncy Castle provider is kt-library-encryption's, so the two calls that name it are not counted.
package demo.vault

import java.security.KeyStore
import java.security.PrivateKey
import java.security.PublicKey
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.SecretKey
import org.bouncycastle.jce.provider.BouncyCastleProvider

class Sealer {
  fun seal(key: SecretKey, plain: ByteArray): ByteArray {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding") // 1
    cipher.init(Cipher.ENCRYPT_MODE, key)
    return cipher.doFinal(plain)
  }

  fun fromTheJdkProvider(): Cipher = Cipher.getInstance("AES/CBC/PKCS5Padding", "SunJCE") // 2

  fun withKeystoreKey(): ByteArray {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    val key = store.getKey("alias", null) as SecretKey
    val cipher = Cipher.getInstance( // 3
        "AES/GCM/NoPadding",
    )
    cipher.init(Cipher.ENCRYPT_MODE, key)
    return cipher.iv
  }

  fun qualified(): Cipher = javax.crypto.Cipher.getInstance("ChaCha20-Poly1305") // 4

  fun agree(mine: PrivateKey, theirs: PublicKey): ByteArray {
    val agreement = KeyAgreement.getInstance("ECDH") // 5
    agreement.init(mine)
    agreement.doPhase(theirs, true)
    return agreement.generateSecret()
  }

  fun x25519(): KeyAgreement = javax.crypto.KeyAgreement.getInstance("X25519") // 6

  fun legacy(): Cipher = Cipher
      .getInstance("DESede/CBC/PKCS5Padding") // 7

  // Through the Bouncy Castle provider: kt-library-encryption's, not counted here.
  fun bouncy(): Cipher = Cipher.getInstance("AES/GCM/NoPadding", "BC")

  fun bouncyByName(): Cipher = Cipher.getInstance("AES/GCM/NoPadding", BouncyCastleProvider.PROVIDER_NAME)
}
