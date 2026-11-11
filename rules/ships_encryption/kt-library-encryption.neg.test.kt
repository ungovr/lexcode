// lexcode-expect: 0
// Cryptography that is the platform's own, and cryptography-library code that is not encrypting
// or agreeing keys. The platform's cryptography APIs are not evidence: javax.crypto's Cipher
// (plain, and through the JDK's own provider), KeyAgreement and the PBKDF2 SecretKeyFactory,
// the Android Keystore's own AES key, the digests, HMACs, signatures and stock TLS beside them.
// Library code that does something else is excluded too: Bouncy Castle digests, signers and
// certificate parsing, and Tink's MAC and signature primitives. Last, project classes that share
// a library's names, with no import of the library: a Box and a SecretBox (libsodium-jni and
// Kalium). Tink is used by its full name, so the file has no Tink primitive import to switch the
// getPrimitive calls on.
package demo.crypto

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.google.crypto.tink.KeysetHandle
import com.google.crypto.tink.PublicKeySign
import demo.keys.Box
import demo.keys.SecretBox
import java.net.URL
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.Signature
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import org.bouncycastle.cert.X509CertificateHolder
import org.bouncycastle.crypto.digests.SHA256Digest
import org.bouncycastle.crypto.signers.Ed25519Signer
import org.bouncycastle.openssl.PEMParser

class PlatformCrypto(private val keyset: KeysetHandle) {
  fun platformCipher(key: SecretKey, plain: ByteArray): ByteArray {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, key)
    return cipher.doFinal(plain)
  }

  fun platformCipherFromTheJdkProvider(): Cipher = Cipher.getInstance("AES/CBC/PKCS5Padding", "SunJCE")

  fun keystoreKey(): SecretKey {
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(
        KeyGenParameterSpec.Builder("alias", KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .build())
    return generator.generateKey()
  }

  fun platformAgreement(mine: java.security.PrivateKey, theirs: java.security.PublicKey): ByteArray {
    val agreement = KeyAgreement.getInstance("ECDH")
    agreement.init(mine)
    agreement.doPhase(theirs, true)
    return agreement.generateSecret()
  }

  fun platformPbkdf2(password: CharArray, salt: ByteArray): ByteArray {
    val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512")
    return factory.generateSecret(PBEKeySpec(password, salt, 8192, 128)).encoded
  }

  fun fingerprint(data: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(data)

  fun tag(key: ByteArray, data: ByteArray): ByteArray {
    val mac = javax.crypto.Mac.getInstance("HmacSHA256")
    mac.init(SecretKeySpec(key, "HmacSHA256"))
    return mac.doFinal(data)
  }

  fun sign(key: java.security.PrivateKey, data: ByteArray): ByteArray {
    val signature = Signature.getInstance("SHA256withRSA")
    signature.initSign(key)
    signature.update(data)
    return signature.sign()
  }

  fun tls(): SSLContext = SSLContext.getInstance("TLS")

  fun fetch(address: String): Int {
    val connection = URL(address).openConnection() as HttpsURLConnection
    return connection.responseCode
  }

  fun store(): KeyStore {
    val keyStore = KeyStore.getInstance("PKCS12")
    keyStore.load(null, null)
    return keyStore
  }

  fun nonce(): ByteArray {
    val bytes = ByteArray(16)
    SecureRandom().nextBytes(bytes)
    return bytes
  }

  fun hash(data: ByteArray): ByteArray {
    val digest = SHA256Digest()
    digest.update(data, 0, data.size)
    val out = ByteArray(digest.digestSize)
    digest.doFinal(out, 0)
    return out
  }

  fun verify(signer: Ed25519Signer, message: ByteArray, signature: ByteArray): Boolean {
    signer.init(false, null)
    signer.update(message, 0, message.size)
    return signer.verifySignature(signature)
  }

  fun certificate(reader: java.io.Reader): X509CertificateHolder = PEMParser(reader).readObject() as X509CertificateHolder

  fun mac(data: ByteArray): ByteArray {
    val mac = keyset.getPrimitive(com.google.crypto.tink.Mac::class.java)
    return mac.computeMac(data)
  }

  fun signWithTink(data: ByteArray): ByteArray {
    val signer = keyset.getPrimitive(PublicKeySign::class.java)
    return signer.sign(data)
  }

  fun projectBox(publicKey: ByteArray, privateKey: ByteArray): Any = Box(publicKey, privateKey)

  fun projectSecretBox(key: ByteArray): Any = SecretBox(key)
}
