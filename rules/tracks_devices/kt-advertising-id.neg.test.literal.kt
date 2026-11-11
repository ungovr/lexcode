// lexcode-expect: 0
// A service looked up by a class literal that is not the telephony service, with the telephony
// property names read from it, in a file that never names TelephonyManager.
package demo.fleet

import android.content.Context
import android.net.ConnectivityManager

class Probe(private val context: Context) {
    fun read(): String? {
        val manager = context.getSystemService(ConnectivityManager::class.java)
        return manager.deviceId
    }
}
