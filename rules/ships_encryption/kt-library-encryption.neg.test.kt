// lexcode-expect: 0
// Cryptography that is the platform's own, and cryptography-library code that is not encrypting
// or agreeing keys. The platform's cryptography APIs are not evidence: javax.crypto's Cipher
// (plain, and through the JDK's own provider), KeyAgreement and the PBKDF2 SecretKeyFactory,
// the Android Keystore's own AES key, the digests, HMACs, signatures and stock TLS beside them.
// Library code that does something else is excluded too: Bouncy Castle digests, signers and
// certificate parsing, Tink's MAC and signature primitives, Nimbus JOSE signing (a JWS, not a
// JWE) and JJWT signing. Last, project classes that share a library's names, with no import of
// the library: a Vault with an encryptWith method, a Utils with getCipherInstance, a Box, a
// SessionCipher, a GroupCipher, an OlmAccount, an OlmMachine, an Encryptors and an AesBytesEncryptor.
// JJWT and Tink are used by their full names, so the file has no io.jsonwebtoken or Commons
// Crypto import to switch those calls on.
package demo.crypto

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import com.google.crypto.tink.KeysetHandle
import com.google.crypto.tink.PublicKeySign
import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.JWSObject
import com.nimbusds.jose.Payload
import com.nimbusds.jose.crypto.MACSigner
import demo.chat.GroupCipher
import demo.chat.OlmAccount
import demo.chat.OlmMachine
import demo.chat.OlmSession
import demo.chat.SessionCipher
import demo.keys.Box
import demo.keys.SecretBox
import demo.keys.Encryptors
import demo.keys.AesBytesEncryptor
import demo.util.Utils
import demo.vault.Vault
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
import org.apache.commons.codec.digest.DigestUtils
import org.bouncycastle.cert.X509CertificateHolder
import org.bouncycastle.crypto.digests.SHA256Digest
import org.bouncycastle.crypto.signers.Ed25519Signer
import org.bouncycastle.openssl.PEMParser

class PlatformCrypto(private val keyset: KeysetHandle) {
  private val vault = Vault()

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

  fun jws(secret: ByteArray): String {
    val jws = JWSObject(JWSHeader(JWSAlgorithm.HS256), Payload("claims"))
    jws.sign(MACSigner(secret))
    return jws.serialize()
  }

  fun jwt(key: SecretKey): String = io.jsonwebtoken.Jwts.builder().subject("someone").signWith(key).compact()

  fun checksum(text: String): String = DigestUtils.sha256Hex(text)

  fun projectEncryptWith(): String = vault.encryptWith("key-1", "text")

  fun projectCipherInstance(properties: java.util.Properties): Any = Utils.getCipherInstance("AES/CTR/NoPadding", properties)

  fun projectBox(publicKey: ByteArray, privateKey: ByteArray): Any = Box(publicKey, privateKey)

  fun projectSecretBox(key: ByteArray): Any = SecretBox(key)

  fun projectSession(store: Any, address: Any): Any = SessionCipher(store, address)

  fun projectGroup(store: Any, name: Any): Any = GroupCipher(store, name)

  fun projectOlm(): Any = OlmAccount()

  fun projectOlmSession(): Any = OlmSession()

  fun projectMachine(user: String): Any = OlmMachine(user, "device")

  fun projectSpring(password: String, salt: String): Any = Encryptors.text(password, salt)

  fun projectSpringBytes(password: String, salt: String): Any = AesBytesEncryptor(password, salt)
}
