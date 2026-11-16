// lexcode-expect: 3
// A JCA cipher through the Bouncy Castle provider by name, with javax.crypto.Cipher fully qualified
// (no import of it). A provider passed as an object is kt-platform-encryption's, so the last call
// is not counted here.
package demo.vault

import org.bouncycastle.jce.provider.BouncyCastleProvider

class Qualified {
  fun byName(): Any = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", "BC") // 1

  fun byConstant(): Any = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", BouncyCastleProvider.PROVIDER_NAME) // 2

  fun byQualifiedConstant(): Any = javax.crypto.Cipher.getInstance( // 3
      "AES/GCM/NoPadding", org.bouncycastle.jce.provider.BouncyCastleProvider.PROVIDER_NAME)

  fun providerObject(): Any = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", BouncyCastleProvider())
}
