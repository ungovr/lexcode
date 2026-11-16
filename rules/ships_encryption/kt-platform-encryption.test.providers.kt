// lexcode-expect: 3
// javax.crypto.Cipher fully qualified, with no import of it. A Bouncy Castle provider named by its
// name ("BC" or PROVIDER_NAME) is kt-library-encryption's, so those three calls are not counted
// here; a provider passed as an object cannot be told from the platform's, so those calls are.
package demo.vault

import java.security.Security
import org.bouncycastle.jce.provider.BouncyCastleProvider

class Providers {
  fun jdk(): Any = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding") // 1

  fun providerObject(): Any = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", BouncyCastleProvider()) // 2

  fun providerLookup(): Any = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", Security.getProvider("BC")) // 3

  // Bouncy Castle by name: kt-library-encryption's, not counted here.
  fun byName(): Any = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", "BC")

  fun byConstant(): Any = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding", BouncyCastleProvider.PROVIDER_NAME)

  fun byQualifiedConstant(): Any = javax.crypto.Cipher.getInstance(
      "AES/GCM/NoPadding", org.bouncycastle.jce.provider.BouncyCastleProvider.PROVIDER_NAME)
}
