// lexcode-expect: 2
// A TelephonyManager reached by a cast of the service lookup and by a typed local, in a file that
// never looks the service up by class literal.
package demo.android

import android.content.Context
import android.telephony.TelephonyManager

class Lookups(private val context: Context) {
    fun cast(): String? {
        val manager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        return manager.deviceId
    }

    fun typed(source: () -> TelephonyManager): String? {
        val manager: TelephonyManager = source()
        return manager.getMeid(0)
    }
}
