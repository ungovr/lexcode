// lexcode-expect: 25
// Encryption and key agreement through libraries the product bundles: Bouncy Castle (block and
// stream ciphers, key agreement, OpenPGP, CMS), Google Tink, libsodium bindings, Jasypt and
// Spring Security Crypto, Nimbus JOSE JWE and JJWT encryption, the Signal protocol, Olm,
// Apache Commons Crypto, the AWS Encryption SDK and PGPainless.
package demo.crypto;

import com.amazonaws.encryptionsdk.AwsCrypto;
import com.google.crypto.tink.Aead;
import com.google.crypto.tink.HybridEncrypt;
import com.google.crypto.tink.KeysetHandle;
import com.google.crypto.tink.aead.AeadConfig;
import com.goterl.lazysodium.LazySodiumJava;
import com.nimbusds.jose.EncryptionMethod;
import com.nimbusds.jose.JWEAlgorithm;
import com.nimbusds.jose.JWEHeader;
import com.nimbusds.jose.JWEObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.RSAEncrypter;
import io.jsonwebtoken.Jwts;
import java.util.Properties;
import org.abstractj.kalium.crypto.Box;
import org.apache.commons.crypto.utils.Utils;
import org.bouncycastle.cms.CMSEnvelopedDataGenerator;
import org.bouncycastle.crypto.agreement.X25519Agreement;
import org.bouncycastle.crypto.engines.AESEngine;
import org.bouncycastle.crypto.modes.ChaCha20Poly1305;
import org.bouncycastle.crypto.modes.GCMBlockCipher;
import org.bouncycastle.crypto.paddings.PaddedBufferedBlockCipher;
import org.bouncycastle.openpgp.PGPEncryptedDataGenerator;
import org.jasypt.util.text.AES256TextEncryptor;
import org.libsodium.jni.crypto.SecretBox;
import org.matrix.olm.OlmAccount;
import org.pgpainless.PGPainless;
import org.springframework.security.crypto.encrypt.AesBytesEncryptor;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.whispersystems.libsignal.SessionCipher;
import org.whispersystems.libsignal.groups.GroupCipher;

public class Vault {
  public byte[] bouncyGcm(byte[] key, byte[] nonce, byte[] data) throws Exception {
    GCMBlockCipher cipher = new GCMBlockCipher(new AESEngine());
    cipher.init(true, null);
    byte[] out = new byte[cipher.getOutputSize(data.length)];
    int n = cipher.processBytes(data, 0, data.length, out, 0);
    cipher.doFinal(out, n);
    return out;
  }

  public GCMBlockCipher bouncyFactory() {
    return GCMBlockCipher.newInstance(AESEngine.newInstance());
  }

  public ChaCha20Poly1305 bouncyChaCha() {
    return new ChaCha20Poly1305();
  }

  public X25519Agreement bouncyAgreement() {
    return new X25519Agreement();
  }

  public Object bouncyPaddedBlock(AESEngine engine) {
    return new PaddedBufferedBlockCipher(engine);
  }

  public Object bouncyPgp(Object builder) {
    return new PGPEncryptedDataGenerator(builder);
  }

  public Object bouncyCms() {
    return new CMSEnvelopedDataGenerator();
  }

  public byte[] tink(KeysetHandle keyset, byte[] data, byte[] context) throws Exception {
    AeadConfig.register();
    Aead aead = keyset.getPrimitive(Aead.class);
    return aead.encrypt(data, context);
  }

  public byte[] tinkHybrid(KeysetHandle publicKeys, byte[] data) throws Exception {
    HybridEncrypt hybrid = publicKeys.getPrimitive(HybridEncrypt.class);
    return hybrid.encrypt(data, null);
  }

  public String sodium(LazySodiumJava sodium, String message, byte[] nonce, byte[] key) throws Exception {
    byte[] cipherText = new byte[message.length() + 16];
    sodium.cryptoSecretBoxEasy(cipherText, message.getBytes(), message.length(), nonce, key);
    return new String(cipherText);
  }

  public void sodiumSealed(LazySodiumJava sodium, byte[] cipherText, byte[] message, byte[] publicKey) {
    sodium.cryptoBoxSealEasy(cipherText, message, message.length, publicKey);
  }

  public byte[] sodiumJni(byte[] key, byte[] nonce, byte[] message) {
    return new SecretBox(key).encrypt(nonce, message);
  }

  public Object kalium(byte[] publicKey, byte[] privateKey) {
    return new Box(publicKey, privateKey);
  }

  public String jasypt(String password, String text) {
    AES256TextEncryptor encryptor = new AES256TextEncryptor();
    encryptor.setPassword(password);
    return encryptor.encrypt(text);
  }

  public String springCrypto(String password, String salt, String text) {
    TextEncryptor encryptor = Encryptors.delux(password, salt);
    return encryptor.encrypt(text);
  }

  public Object springBytes(String password, String salt) {
    return new AesBytesEncryptor(password, salt);
  }

  public String nimbusJwe(java.security.interfaces.RSAPublicKey publicKey, String claims) throws Exception {
    JWEObject jwe = new JWEObject(
        new JWEHeader(JWEAlgorithm.RSA_OAEP_256, EncryptionMethod.A256GCM), new Payload(claims));
    jwe.encrypt(new RSAEncrypter(publicKey));
    return jwe.serialize();
  }

  public String jjwtEncrypted(javax.crypto.SecretKey key) {
    return Jwts.builder().subject("someone").encryptWith(key, Jwts.ENC.A256GCM).compact();
  }

  public Object signalSession(Object store, Object address) {
    return new SessionCipher(store, address);
  }

  public Object signalGroup(Object store, Object name) {
    return new GroupCipher(store, name);
  }

  public Object olmAccount() throws Exception {
    return new OlmAccount();
  }

  public Object commonsCrypto(Properties properties) throws Exception {
    return Utils.getCipherInstance("AES/CTR/NoPadding", properties);
  }

  public Object awsEncryptionSdk() {
    return AwsCrypto.builder().build();
  }

  public Object pgpainless() {
    return PGPainless.encryptAndOrSign();
  }
}
