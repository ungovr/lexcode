// lexcode-expect: 5
// Current Tink: each encrypting primitive's registration, and getPrimitive with a configuration
// first (#13336).
import com.google.crypto.tink.Aead;
import com.google.crypto.tink.HybridEncrypt;
import com.google.crypto.tink.KeysetHandle;
import com.google.crypto.tink.RegistryConfiguration;
import com.google.crypto.tink.daead.DeterministicAeadConfig;
import com.google.crypto.tink.hybrid.HybridConfig;
import com.google.crypto.tink.streamingaead.StreamingAeadConfig;

class TinkCurrent {
  byte[] seal(KeysetHandle handle, byte[] data) throws Exception {
    Aead aead = handle.getPrimitive(RegistryConfiguration.get(), Aead.class);
    return aead.encrypt(data, new byte[0]);
  }

  byte[] sealFor(KeysetHandle publicHandle, byte[] data) throws Exception {
    HybridConfig.register();
    HybridEncrypt enc = publicHandle.getPrimitive(RegistryConfiguration.get(), HybridEncrypt.class);
    return enc.encrypt(data, new byte[0]);
  }

  void registerOthers() throws Exception {
    DeterministicAeadConfig.register();
    StreamingAeadConfig.register();
  }
}
