// lexcode-expect: 14
// Encryption and key agreement through frameworks the product bundles: Jasypt and Spring Security
// Crypto, Nimbus JOSE JWE and JJWT encryption, the Signal protocol, Olm and the Matrix crypto
// machine, Apache Commons Crypto (cipher and stream), the AWS Encryption SDK and PGPainless.
package demo.crypto

import com.amazonaws.encryptionsdk.AwsCrypto
import com.nimbusds.jose.EncryptionMethod
import com.nimbusds.jose.JWEAlgorithm
import com.nimbusds.jose.JWEHeader
import com.nimbusds.jose.JWEObject
import com.nimbusds.jose.Payload
import com.nimbusds.jose.crypto.DirectEncrypter
import com.nimbusds.jose.crypto.RSAEncrypter
import io.jsonwebtoken.Jwts
import java.util.Properties
import org.apache.commons.crypto.stream.CryptoOutputStream
import org.apache.commons.crypto.utils.Utils
import org.jasypt.util.text.AES256TextEncryptor
import org.matrix.olm.OlmAccount
import org.matrix.rustcomponents.sdk.crypto.OlmMachine
import org.pgpainless.PGPainless
import org.springframework.security.crypto.encrypt.AesBytesEncryptor
import org.springframework.security.crypto.encrypt.Encryptors
import org.springframework.security.crypto.encrypt.TextEncryptor
import org.whispersystems.libsignal.SessionCipher
import org.whispersystems.libsignal.groups.GroupCipher

class Frameworks {
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

  fun nimbusDirect(key: ByteArray): Any = DirectEncrypter(key)

  fun jjwtEncrypted(key: javax.crypto.SecretKey): String =
      Jwts.builder().subject("someone").encryptWith(key, Jwts.ENC.A256GCM).compact()

  fun signalSession(store: Any, address: Any): Any = SessionCipher(store, address)

  fun signalGroup(store: Any, name: Any): Any = GroupCipher(store, name)

  fun olmAccount(): Any = OlmAccount()

  fun matrixMachine(user: String, device: String): Any = OlmMachine(user, device)

  fun commonsCrypto(properties: Properties): Any = Utils.getCipherInstance("AES/CTR/NoPadding", properties)

  fun commonsStream(output: java.io.OutputStream, cipher: Any, bufferSize: Int): Any = CryptoOutputStream(output, cipher, bufferSize)

  fun awsEncryptionSdk(): Any = AwsCrypto.builder().build()

  fun pgpainless(): Any = PGPainless.encryptAndOrSign()
}
