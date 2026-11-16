// lexcode-expect: 5
// Bouncy Castle's lightweight RSA-OAEP, stream engines and a bare block mode (#13336).
import org.bouncycastle.crypto.AsymmetricBlockCipher;
import org.bouncycastle.crypto.BlockCipher;
import org.bouncycastle.crypto.StreamCipher;
import org.bouncycastle.crypto.encodings.OAEPEncoding;
import org.bouncycastle.crypto.engines.AESEngine;
import org.bouncycastle.crypto.engines.ChaCha7539Engine;
import org.bouncycastle.crypto.engines.RSAEngine;
import org.bouncycastle.crypto.engines.XSalsa20Engine;
import org.bouncycastle.crypto.modes.CBCBlockCipher;
import org.bouncycastle.crypto.modes.SICBlockCipher;

class Lightweight {
  AsymmetricBlockCipher rsaOaep() {
    return new OAEPEncoding(new RSAEngine());
  }

  StreamCipher stream() {
    return new ChaCha7539Engine();
  }

  StreamCipher xsalsa() {
    return new XSalsa20Engine();
  }

  BlockCipher cbc() {
    return CBCBlockCipher.newInstance(AESEngine.newInstance());
  }

  BlockCipher ctr() {
    return new SICBlockCipher(new AESEngine());
  }
}
