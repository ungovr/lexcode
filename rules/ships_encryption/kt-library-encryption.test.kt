// lexcode-expect: 28
// Encryption and key agreement through libraries the product bundles: Bouncy Castle (block and
// stream ciphers, key agreement, OpenPGP, CMS), Google Tink, libsodium bindings, Jasypt and
// Spring Security Crypto, Nimbus JOSE JWE and JJWT encryption, the Signal protocol, Olm and the
// Matrix crypto machine, Apache Commons Crypto, the AWS Encryption SDK and PGPainless, and a JCA
// cipher built through the Bouncy Castle provider.
package demo.crypto

import com.amazonaws.encryptionsdk.AwsCrypto
import com.google.crypto.tink.Aead
import com.google.crypto.tink.HybridEncrypt
import com.google.crypto.tink.KeysetHandle
import com.google.crypto.tink.aead.AeadConfig
import com.goterl.lazysodium.LazySodiumJava
import com.nimbusds.jose.EncryptionMethod
import com.nimbusds.jose.JWEAlgorithm
import com.nimbusds.jose.JWEHeader
import com.nimbusds.jose.JWEObject
import com.nimbusds.jose.Payload
import com.nimbusds.jose.crypto.RSAEncrypter
import io.jsonwebtoken.Jwts
import java.util.Properties
import javax.crypto.Cipher
import org.abstractj.kalium.crypto.Box
import org.apache.commons.crypto.utils.Utils
import org.bouncycastle.cms.CMSEnvelopedDataGenerator
import org.bouncycastle.crypto.agreement.X25519Agreement
import org.bouncycastle.crypto.engines.AESEngine
import org.bouncycastle.crypto.modes.ChaCha20Poly1305
import org.bouncycastle.crypto.modes.GCMBlockCipher
import org.bouncycastle.crypto.paddings.PaddedBufferedBlockCipher
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.openpgp.PGPEncryptedDataGenerator
import org.jasypt.util.text.AES256TextEncryptor
import org.libsodium.jni.crypto.SecretBox
import org.matrix.olm.OlmAccount
import org.matrix.rustcomponents.sdk.crypto.OlmMachine
import org.pgpainless.PGPainless
import org.springframework.security.crypto.encrypt.AesBytesEncryptor
import org.springframework.security.crypto.encrypt.Encryptors
import org.springframework.security.crypto.encrypt.TextEncryptor
import org.whispersystems.libsignal.SessionCipher
import org.whispersystems.libsignal.groups.GroupCipher

class Vault {
  fun bouncyGcm(data: ByteArray): ByteArray {
    val cipher = GCMBlockCipher(AESEngine())
    cipher.init(true, null)
    val out = ByteArray(cipher.getOutputSize(data.size))
    val n = cipher.processBytes(data, 0, data.size, out, 0)
    cipher.doFinal(out, n)
    return out
  }

  fun bouncyFactory(): GCMBlockCipher = GCMBlockCipher.newInstance(AESEngine.newInstance())

  fun bouncyChaCha(): ChaCha20Poly1305 = ChaCha20Poly1305()

  fun bouncyAgreement(): X25519Agreement = X25519Agreement()

  fun bouncyPaddedBlock(engine: AESEngine): Any = PaddedBufferedBlockCipher(engine)

  fun bouncyPgp(builder: Any): Any = PGPEncryptedDataGenerator(builder)

  fun bouncyCms(): Any = CMSEnvelopedDataGenerator()

  fun tink(keyset: KeysetHandle, data: ByteArray, context: ByteArray): ByteArray {
    AeadConfig.register()
    val aead = keyset.getPrimitive(Aead::class.java)
    return aead.encrypt(data, context)
  }

  fun tinkHybrid(publicKeys: KeysetHandle, data: ByteArray): ByteArray {
    val hybrid = publicKeys.getPrimitive(HybridEncrypt::class.java)
    return hybrid.encrypt(data, null)
  }

  fun sodium(sodium: LazySodiumJava, message: String, nonce: ByteArray, key: ByteArray): String {
    val cipherText = ByteArray(message.length + 16)
    sodium.cryptoSecretBoxEasy(cipherText, message.toByteArray(), message.length.toLong(), nonce, key)
    return String(cipherText)
  }

  fun sodiumSealed(sodium: LazySodiumJava, cipherText: ByteArray, message: ByteArray, publicKey: ByteArray) {
    sodium.cryptoBoxSealEasy(cipherText, message, message.size.toLong(), publicKey)
  }

  fun sodiumJni(key: ByteArray, nonce: ByteArray, message: ByteArray): ByteArray = SecretBox(key).encrypt(nonce, message)

  fun kalium(publicKey: ByteArray, privateKey: ByteArray): Any = Box(publicKey, privateKey)

  fun jasypt(password: String, text: String): String {
    val encryptor = AES256TextEncryptor()
    encryptor.setPassword(password)
    return encryptor.encrypt(text)
  }

  fun springCrypto(password: String, salt: String, text: String): String {
    val encryptor: TextEncryptor = Encryptors.delux(password, salt)
    return encryptor.encrypt(text)
  }

  fun springBytes(password: String, salt: String): Any = AesBytesEncryptor(password, salt)

  fun nimbusJwe(publicKey: java.security.interfaces.RSAPublicKey, claims: String): String {
    val jwe = JWEObject(JWEHeader(JWEAlgorithm.RSA_OAEP_256, EncryptionMethod.A256GCM), Payload(claims))
    jwe.encrypt(RSAEncrypter(publicKey))
    return jwe.serialize()
  }

  fun jjwtEncrypted(key: javax.crypto.SecretKey): String =
      Jwts.builder().subject("someone").encryptWith(key, Jwts.ENC.A256GCM).compact()

  fun signalSession(store: Any, address: Any): Any = SessionCipher(store, address)

  fun signalGroup(store: Any, name: Any): Any = GroupCipher(store, name)

  fun olmAccount(): Any = OlmAccount()

  fun matrixMachine(user: String, device: String): Any = OlmMachine(user, device)

  fun commonsCrypto(properties: Properties): Any = Utils.getCipherInstance("AES/CTR/NoPadding", properties)

  fun awsEncryptionSdk(): Any = AwsCrypto.builder().build()

  fun pgpainless(): Any = PGPainless.encryptAndOrSign()

  fun providerByName(): Cipher = Cipher.getInstance("AES/GCM/NoPadding", "BC")

  fun providerByConstant(): Cipher = Cipher.getInstance("ChaCha20-Poly1305", BouncyCastleProvider.PROVIDER_NAME)
}
