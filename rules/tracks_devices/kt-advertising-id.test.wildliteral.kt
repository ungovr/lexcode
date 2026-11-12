// lexcode-expect: 1
// The telephony service looked up by class literal, with the telephony package imported by wildcard.
package demo.android

import android.content.Context
import android.telephony.*

class WildLiteral(private val context: Context) {
    fun subscriber(): String? {
        val manager = context.getSystemService(TelephonyManager::class.java)
        return manager.subscriberId
    }
}
