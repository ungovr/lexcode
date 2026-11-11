// lexcode-expect: 16
// Encryption and key agreement through libraries the product bundles: Bouncy Castle (block and
// stream ciphers, key agreement, OpenPGP, CMS), Google Tink, libsodium bindings, and a JCA
// cipher built through the Bouncy Castle provider.
package demo.crypto

import com.google.crypto.tink.Aead
import com.google.crypto.tink.HybridEncrypt
import com.google.crypto.tink.KeysetHandle
import com.google.crypto.tink.aead.AeadConfig
import com.goterl.lazysodium.LazySodiumJava
import javax.crypto.Cipher
import org.abstractj.kalium.crypto.Box
import org.bouncycastle.cms.CMSEnvelopedDataGenerator
import org.bouncycastle.crypto.agreement.X25519Agreement
import org.bouncycastle.crypto.engines.AESEngine
import org.bouncycastle.crypto.modes.ChaCha20Poly1305
import org.bouncycastle.crypto.modes.GCMBlockCipher
import org.bouncycastle.crypto.paddings.PaddedBufferedBlockCipher
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.openpgp.PGPEncryptedDataGenerator
import org.libsodium.jni.crypto.SecretBox

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

  fun providerByName(): Cipher = Cipher.getInstance("AES/GCM/NoPadding", "BC")

  fun providerByConstant(): Cipher = Cipher.getInstance("ChaCha20-Poly1305", BouncyCastleProvider.PROVIDER_NAME)
}
