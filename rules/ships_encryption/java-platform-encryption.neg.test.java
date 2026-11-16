// lexcode-expect: 0
// Cryptography that encrypts nothing and agrees no key, from the JDK: a digest, an HMAC, a PBKDF2
// key factory, a signature, random bytes and a key that is only generated, then HTTPS through the
// JDK's client, HttpsURLConnection and OkHttp. Last, the app's own Cipher and KeyAgreement classes,
// in a file that does not import javax.crypto's.
package demo.accounts;

import demo.legacy.Cipher;
import demo.legacy.KeyAgreement;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.Signature;
import javax.crypto.KeyGenerator;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import javax.net.ssl.HttpsURLConnection;
import okhttp3.OkHttpClient;
import okhttp3.Request;

public class Credentials {
  public byte[] sha256(String text) throws Exception {
    return MessageDigest.getInstance("SHA-256").digest(text.getBytes());
  }

  public byte[] tag(byte[] key, byte[] body) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(key, "HmacSHA256"));
    return mac.doFinal(body);
  }

  public byte[] platformPbkdf2(char[] password, byte[] salt) throws Exception {
    SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
    return factory.generateSecret(new PBEKeySpec(password, salt, 600000, 256)).getEncoded();
  }

  public byte[] sign(java.security.PrivateKey key, byte[] data) throws Exception {
    Signature signature = Signature.getInstance("SHA256withECDSA");
    signature.initSign(key);
    signature.update(data);
    return signature.sign();
  }

  public byte[] nonce() {
    byte[] bytes = new byte[16];
    new SecureRandom().nextBytes(bytes);
    return bytes;
  }

  public SecretKey newKey() throws Exception {
    return KeyGenerator.getInstance("AES").generateKey();
  }

  public String fetch(String address) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    HttpResponse<String> reply = client.send(
        HttpRequest.newBuilder(URI.create("https://api.example.org/v1/items")).build(),
        HttpResponse.BodyHandlers.ofString());
    HttpsURLConnection connection = (HttpsURLConnection) new URL(address).openConnection();
    connection.getResponseCode();
    new OkHttpClient().newCall(new Request.Builder().url("https://api.example.org/v1/items").build()).execute();
    return reply.body();
  }

  public Object own(String name) {
    return Cipher.getInstance(name) + KeyAgreement.getInstance(name);
  }
}
