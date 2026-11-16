// lexcode-expect: 0
// Cryptography that is not encrypting or agreeing keys, from the platform and from libraries: the
// PBKDF2 SecretKeyFactory, the Android Keystore's own AES key (generated, not used), the digests,
// HMACs, signatures and stock TLS of the JDK, Bouncy Castle digests, signers and certificate
// parsing, and Tink's MAC and signature primitives. (A javax.crypto Cipher or KeyAgreement through
// the JDK's own provider is shipping encryption too; kt-platform-encryption reads it.) Last,
// project classes that share a library's names, with no import of the library: a Box and a
// SecretBox (libsodium-jni and Kalium). Tink is used by its full name, so the file has no Tink
// primitive import to switch the getPrimitive calls on.
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
  fun keystoreKey(): SecretKey {
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(
        KeyGenParameterSpec.Builder("alias", KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .build())
    return generator.generateKey()
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
