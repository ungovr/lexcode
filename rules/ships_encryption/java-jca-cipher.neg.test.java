// lexcode-expect: 0
// Java cryptography that is not application-level encryption: digests and HMACs, signatures,
// the platform's default TLS, key storage and random numbers, and a project class that happens
// to be named Cipher. Nothing here encrypts or decrypts data or agrees a key.
package demo.crypto;

import demo.legacy.Cipher;
import java.net.URL;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.Signature;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;

public class Integrity {
  public byte[] fingerprint(byte[] data) throws Exception {
    return MessageDigest.getInstance("SHA-256").digest(data);
  }

  public byte[] tag(byte[] key, byte[] data) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
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

  public Cipher rot13() {
    return Cipher.getInstance("ROT13");
  }
}
