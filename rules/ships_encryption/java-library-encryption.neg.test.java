// lexcode-expect: 0
// Cryptography that is the platform's own, and cryptography-library code that is not encrypting
// or agreeing keys. The platform's cryptography APIs are not evidence: javax.crypto's Cipher
// (plain, and through the JDK's own provider), KeyAgreement and the PBKDF2 SecretKeyFactory,
// the digests, HMACs, signatures and stock TLS beside them. Library code that does something
// else is excluded too: Bouncy Castle digests, signers and certificate parsing, Tink's MAC and
// signature primitives, Nimbus JOSE signing (a JWS, not a JWE) and JJWT signing. Last, project
// classes that share a library's method names, with no import of the library: a Vault with an
// encryptWith method, a Utils with getCipherInstance, and a Box. JJWT and Tink are used by their
// full names, so the file has no io.jsonwebtoken or Commons Crypto import to switch those calls on.
package demo.crypto;

import com.google.crypto.tink.KeysetHandle;
import com.google.crypto.tink.PublicKeySign;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import demo.keys.Box;
import demo.util.Utils;
import demo.vault.Vault;
import java.net.URL;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.Signature;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
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

public class PlatformCrypto {
  private final KeysetHandle keyset;
  private final Vault vault = new Vault();

  public PlatformCrypto(KeysetHandle keyset) {
    this.keyset = keyset;
  }

  public byte[] platformCipher(SecretKey key, byte[] iv, byte[] plain) throws Exception {
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.ENCRYPT_MODE, key);
    return cipher.doFinal(plain);
  }

  public Cipher platformCipherFromTheJdkProvider() throws Exception {
    return Cipher.getInstance("AES/CBC/PKCS5Padding", "SunJCE");
  }

  public byte[] platformAgreement(java.security.PrivateKey mine, java.security.PublicKey theirs) throws Exception {
    KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
    agreement.init(mine);
    agreement.doPhase(theirs, true);
    return agreement.generateSecret();
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

  public Object projectBox(byte[] publicKey, byte[] privateKey) {
    return new Box(publicKey, privateKey);
  }
}
