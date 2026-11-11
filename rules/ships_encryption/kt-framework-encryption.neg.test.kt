// lexcode-expect: 0
// Cryptography-framework code that is not encrypting: Nimbus JOSE signing (a JWS, not a JWE; the
// MACSigner class sits in the same package as the encrypters and no guard names it), JJWT signing,
// and a Commons Codec digest. Then project classes that share a framework's names, in a file that
// imports no class of those frameworks: a Vault with an encryptWith method, a Utils with
// getCipherInstance, the six Nimbus encrypter names, CryptoOutputStream, SessionCipher,
// GroupCipher, OlmAccount, OlmSession, OlmMachine, Encryptors and AesBytesEncryptor. JJWT is used
// by its full name, so the file has no io.jsonwebtoken import to switch encryptWith on.
package demo.crypto

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
import demo.jose.AESEncrypter
import demo.jose.DirectEncrypter
import demo.jose.ECDHEncrypter
import demo.jose.PasswordBasedEncrypter
import demo.jose.RSAEncrypter
import demo.jose.X25519Encrypter
import demo.keys.AesBytesEncryptor
import demo.keys.Encryptors
import demo.stream.CryptoOutputStream
import demo.util.Utils
import demo.vault.Vault
import javax.crypto.SecretKey
import org.apache.commons.codec.digest.DigestUtils

class FrameworkCrypto {
  private val vault = Vault()

  fun jws(secret: ByteArray): String {
    val jws = JWSObject(JWSHeader(JWSAlgorithm.HS256), Payload("claims"))
    jws.sign(MACSigner(secret))
    return jws.serialize()
  }

  fun jwt(key: SecretKey): String = io.jsonwebtoken.Jwts.builder().subject("someone").signWith(key).compact()

  fun checksum(text: String): String = DigestUtils.sha256Hex(text)

  fun projectEncryptWith(): String = vault.encryptWith("key-1", "text")

  fun projectCipherInstance(properties: java.util.Properties): Any = Utils.getCipherInstance("AES/CTR/NoPadding", properties)

  fun projectRsa(key: Any): Any = RSAEncrypter(key)

  fun projectDirect(key: Any): Any = DirectEncrypter(key)

  fun projectAes(key: Any): Any = AESEncrypter(key)

  fun projectEcdh(key: Any): Any = ECDHEncrypter(key)

  fun projectX25519(key: Any): Any = X25519Encrypter(key)

  fun projectPassword(password: String): Any = PasswordBasedEncrypter(password, 16, 1000)

  fun projectStream(output: java.io.OutputStream): Any = CryptoOutputStream(output)

  fun projectSession(store: Any, address: Any): Any = SessionCipher(store, address)

  fun projectGroup(store: Any, name: Any): Any = GroupCipher(store, name)

  fun projectOlm(): Any = OlmAccount()

  fun projectOlmSession(): Any = OlmSession()

  fun projectMachine(user: String): Any = OlmMachine(user, "device")

  fun projectSpring(password: String, salt: String): Any = Encryptors.text(password, salt)

  fun projectSpringBytes(password: String, salt: String): Any = AesBytesEncryptor(password, salt)
}
