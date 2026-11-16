// lexcode-expect: 0
// Cryptography that encrypts nothing and agrees no key, from the platform: a digest, an HMAC, a
// PBKDF2 key factory, a signature, random bytes and a key that is only generated, then HTTPS
// through the JDK's client, HttpsURLConnection and OkHttp. Last, the app's own Cipher and
// KeyAgreement classes, in a file that does not import javax.crypto's.
package demo.accounts

import demo.legacy.Cipher
import demo.legacy.KeyAgreement
import java.net.URI
import java.net.URL
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.SecureRandom
import java.security.Signature
import javax.crypto.KeyGenerator
import javax.crypto.Mac
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import javax.net.ssl.HttpsURLConnection
import okhttp3.OkHttpClient
import okhttp3.Request

class Credentials {
  fun sha256(text: String): ByteArray = MessageDigest.getInstance("SHA-256").digest(text.toByteArray())

  fun tag(key: ByteArray, body: ByteArray): ByteArray {
    val mac = Mac.getInstance("HmacSHA256")
    mac.init(SecretKeySpec(key, "HmacSHA256"))
    return mac.doFinal(body)
  }

  fun pbkdf2(password: CharArray, salt: ByteArray): ByteArray =
      SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(PBEKeySpec(password, salt, 600000, 256)).encoded

  fun sign(key: PrivateKey, data: ByteArray): ByteArray {
    val signature = Signature.getInstance("SHA256withECDSA")
    signature.initSign(key)
    signature.update(data)
    return signature.sign()
  }

  fun nonce(): ByteArray = ByteArray(16).also { SecureRandom().nextBytes(it) }

  fun newKey(): SecretKey = KeyGenerator.getInstance("AES").generateKey()

  fun fetch(address: String): String {
    val reply = HttpClient.newHttpClient().send(
        HttpRequest.newBuilder(URI.create("https://api.example.org/v1/items")).build(),
        HttpResponse.BodyHandlers.ofString())
    (URL(address).openConnection() as HttpsURLConnection).responseCode
    OkHttpClient().newCall(Request.Builder().url("https://api.example.org/v1/items").build()).execute()
    return reply.body()
  }

  fun own(name: String): String = Cipher.getInstance(name).toString() + KeyAgreement.getInstance(name)
}
