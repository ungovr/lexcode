// lexcode-expect: 2
// The platform's Cipher and KeyAgreement under a wildcard import of javax.crypto.
package demo.vault

import java.security.PrivateKey
import javax.crypto.*

class Wildcard {
  fun cipher(): Cipher = Cipher.getInstance("AES/GCM/NoPadding") // 1

  fun agreement(mine: PrivateKey): KeyAgreement {
    val agreement = KeyAgreement.getInstance("XDH") // 2
    agreement.init(mine)
    return agreement
  }
}
