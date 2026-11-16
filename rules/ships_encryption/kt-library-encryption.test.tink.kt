// lexcode-expect: 5
// Current Tink: each encrypting primitive's registration, and getPrimitive with a configuration
// first (#13336).
import com.google.crypto.tink.Aead
import com.google.crypto.tink.HybridEncrypt
import com.google.crypto.tink.KeysetHandle
import com.google.crypto.tink.RegistryConfiguration
import com.google.crypto.tink.daead.DeterministicAeadConfig
import com.google.crypto.tink.hybrid.HybridConfig
import com.google.crypto.tink.streamingaead.StreamingAeadConfig

class TinkCurrent {
  fun seal(handle: KeysetHandle, data: ByteArray): ByteArray {
    val aead = handle.getPrimitive(RegistryConfiguration.get(), Aead::class.java)
    return aead.encrypt(data, ByteArray(0))
  }

  fun sealFor(publicHandle: KeysetHandle, data: ByteArray): ByteArray {
    HybridConfig.register()
    val enc = publicHandle.getPrimitive(RegistryConfiguration.get(), HybridEncrypt::class.java)
    return enc.encrypt(data, ByteArray(0))
  }

  fun registerOthers() {
    DeterministicAeadConfig.register()
    StreamingAeadConfig.register()
  }
}
