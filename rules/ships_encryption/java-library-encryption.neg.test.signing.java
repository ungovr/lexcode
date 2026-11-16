// lexcode-expect: 0
// Bouncy Castle and Tink used only to hash, MAC and sign ship no encryption (#13336).
import com.google.crypto.tink.KeysetHandle;
import com.google.crypto.tink.Mac;
import com.google.crypto.tink.PublicKeySign;
import com.google.crypto.tink.RegistryConfiguration;
import com.google.crypto.tink.mac.MacConfig;
import com.google.crypto.tink.signature.SignatureConfig;
import org.bouncycastle.crypto.digests.SHA256Digest;
import org.bouncycastle.crypto.signers.Ed25519Signer;

class SigningOnly {
  byte[] tag(KeysetHandle handle, byte[] data) throws Exception {
    MacConfig.register();
    Mac mac = handle.getPrimitive(RegistryConfiguration.get(), Mac.class);
    return mac.computeMac(data);
  }

  byte[] sign(KeysetHandle handle, byte[] data) throws Exception {
    SignatureConfig.register();
    PublicKeySign signer = handle.getPrimitive(PublicKeySign.class);
    return signer.sign(data);
  }

  byte[] digest(byte[] data) {
    SHA256Digest d = new SHA256Digest();
    d.update(data, 0, data.length);
    byte[] out = new byte[32];
    d.doFinal(out, 0);
    return out;
  }

  Ed25519Signer edSigner() {
    return new Ed25519Signer();
  }
}
