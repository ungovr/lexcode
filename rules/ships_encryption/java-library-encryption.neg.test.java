// lexcode-expect: 0
// Cryptography-library code that is not encrypting or agreeing keys: Bouncy Castle used for
// digests, signatures and certificate parsing, Tink's MAC and signature primitives, Nimbus JOSE
// signing (a JWS, not a JWE), JJWT signing, Apache Commons Codec digests, a Jasypt-free
// "encryptor" that is a project class, and the platform's stock TLS.
package demo.crypto;

import com.google.crypto.tink.KeysetHandle;
import com.google.crypto.tink.Mac;
import com.google.crypto.tink.PublicKeySign;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import org.apache.commons.codec.digest.DigestUtils;
import org.bouncycastle.crypto.digests.SHA256Digest;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.cert.X509CertificateHolder;

public class Signing {
  private final KeysetHandle keyset;
  private final demo.vault.Encryptor encryptor = new demo.vault.Encryptor();

  public Signing(KeysetHandle keyset) {
    this.keyset = keyset;
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
    Mac mac = keyset.getPrimitive(Mac.class);
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
    return Jwts.builder().subject("someone").signWith(key).compact();
  }

  public SecretKey newJwtKey() {
    return Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS256);
  }

  public String checksum(String text) {
    return DigestUtils.sha256Hex(text);
  }

  public String scramble(String text) {
    return encryptor.encrypt(text);
  }
}
