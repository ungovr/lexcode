// lexcode-expect: 0
// Cryptography that is not encrypting or agreeing keys, from the platform and from libraries: the
// PBKDF2 SecretKeyFactory, the digests, HMACs, signatures and stock TLS of the JDK, Bouncy Castle
// digests, signers and certificate parsing, Tink's MAC and signature primitives, Nimbus JOSE
// signing (a JWS, not a JWE) and JJWT signing. (A javax.crypto Cipher or KeyAgreement through the
// JDK's own provider is shipping encryption too; java-platform-encryption reads it.) Last, project
// classes that share a library's method names, with no import of the library: a Vault with an
// encryptWith method, a Utils with getCipherInstance, a Box, the six Nimbus encrypter names and a
// CryptoOutputStream. JJWT and Tink are used by their
// full names, so the file has no io.jsonwebtoken or Commons Crypto import to switch those calls on.
package demo.crypto;

import com.google.crypto.tink.KeysetHandle;
import com.google.crypto.tink.PublicKeySign;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import demo.jose.AESEncrypter;
import demo.jose.DirectEncrypter;
import demo.jose.ECDHEncrypter;
import demo.jose.PasswordBasedEncrypter;
import demo.jose.RSAEncrypter;
import demo.jose.X25519Encrypter;
import demo.keys.Box;
import demo.stream.CryptoOutputStream;
import demo.util.Utils;
import demo.vault.Vault;
import java.net.URL;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.Signature;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import org.apache.commons.codec.digest.DigestUtils;
import org.bouncycastle.crypto.digests.SHA256Digest;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.cert.X509CertificateHolder;
import org.pgpainless.PGPainless;
import org.pgpainless.encryption_signing.ProducerOptions;
import org.pgpainless.encryption_signing.SigningOptions;

public class PlatformCrypto {
  private final KeysetHandle keyset;
  private final Vault vault = new Vault();

  public PlatformCrypto(KeysetHandle keyset) {
    this.keyset = keyset;
  }

  public byte[] platformPbkdf2(char[] password, byte[] salt) throws Exception {
    SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512");
    return factory.generateSecret(new PBEKeySpec(password, salt, 8192, 128)).getEncoded();
  }

  public byte[] fingerprint(byte[] data) throws Exception {
    return MessageDigest.getInstance("SHA-256").digest(data);
  }

  public byte[] tag(byte[] key, byte[] data) throws Exception {
    javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(key, "HmacSHA256"));
    return mac.doFinal(data);
  }

  public byte[] sign(java.security.PrivateKey key, byte[] data) throws Exception {
    Signature signature = Signature.getInstance("SHA256withRSA");
    signature.initSign(key);
    signature.update(data);
    return signature.sign();
  }

  public SSLContext tls() throws Exception {
    return SSLContext.getInstance("TLS");
  }

  public int fetch(String address) throws Exception {
    HttpsURLConnection connection = (HttpsURLConnection) new URL(address).openConnection();
    return connection.getResponseCode();
  }

  public KeyStore store() throws Exception {
    KeyStore keyStore = KeyStore.getInstance("PKCS12");
    keyStore.load(null, null);
    return keyStore;
  }

  public byte[] nonce() {
    byte[] bytes = new byte[16];
    new SecureRandom().nextBytes(bytes);
    return bytes;
  }

  public byte[] hash(byte[] data) {
    SHA256Digest digest = new SHA256Digest();
    digest.update(data, 0, data.length);
    byte[] out = new byte[digest.getDigestSize()];
    digest.doFinal(out, 0);
    return out;
  }

  public boolean verify(Ed25519Signer signer, byte[] message, byte[] signature) {
    signer.init(false, null);
    signer.update(message, 0, message.length);
    return signer.verifySignature(signature);
  }

  public X509CertificateHolder certificate(java.io.Reader reader) throws Exception {
    return (X509CertificateHolder) new PEMParser(reader).readObject();
  }

  public byte[] mac(byte[] data) throws Exception {
    com.google.crypto.tink.Mac mac = keyset.getPrimitive(com.google.crypto.tink.Mac.class);
    return mac.computeMac(data);
  }

  public byte[] signWithTink(byte[] data) throws Exception {
    PublicKeySign signer = keyset.getPrimitive(PublicKeySign.class);
    return signer.sign(data);
  }

  public String jws(byte[] secret) throws Exception {
    JWSObject object = new JWSObject(new JWSHeader(JWSAlgorithm.HS256), new Payload("claims"));
    object.sign(new MACSigner(secret));
    return object.serialize();
  }

  public String jwt(SecretKey key) {
    return io.jsonwebtoken.Jwts.builder().subject("someone").signWith(key).compact();
  }

  public SecretKey newJwtKey() {
    return io.jsonwebtoken.security.Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
  }

  public String checksum(String text) {
    return DigestUtils.sha256Hex(text);
  }

  public String projectEncryptWith() {
    return vault.encryptWith("key-1", "text");
  }

  public Object projectCipherInstance(java.util.Properties properties) throws Exception {
    return Utils.getCipherInstance("AES/CTR/NoPadding", properties);
  }

  public Object projectRsa(Object key) {
    return new RSAEncrypter(key);
  }

  public Object projectDirect(Object key) {
    return new DirectEncrypter(key);
  }

  public Object projectAes(Object key) {
    return new AESEncrypter(key);
  }

  public Object projectEcdh(Object key) {
    return new ECDHEncrypter(key);
  }

  public Object projectX25519(Object key) {
    return new X25519Encrypter(key);
  }

  public Object projectPassword(String password) {
    return new PasswordBasedEncrypter(password, 16, 1000);
  }

  public Object projectStream(java.io.OutputStream output) {
    return new CryptoOutputStream(output);
  }

  public Object projectBox(byte[] publicKey, byte[] privateKey) {
    return new Box(publicKey, privateKey);
  }

  // PGPainless used only to sign: its sign-or-encrypt entry point with signing options alone.
  public Object pgpSignOnly(java.io.OutputStream out, SigningOptions signing) throws Exception {
    return PGPainless.encryptAndOrSign().onOutputStream(out).withOptions(ProducerOptions.sign(signing));
  }
}
