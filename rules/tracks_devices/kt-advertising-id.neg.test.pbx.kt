// lexcode-expect: 0
// A TelephonyManager of the app's own (a phone-system gateway), imported from the app's package,
// with deviceId and subscriberId read from it in each way a declaration can bind the receiver.
package demo.pbx

import com.acme.pbx.TelephonyManager
import com.acme.pbx.Registry

class Console(private val tm: TelephonyManager) {
    fun describe(): String = tm.deviceId + tm.subscriberId
}

fun summary(gateway: TelephonyManager): String? {
    val id = gateway.getSubscriberId()
    return id
}

class Gateways(private val registry: Registry) {
    lateinit var primary: TelephonyManager

    fun first(): String? = primary.deviceId

    fun lookup(): String? {
        val tm = registry.getSystemService(TelephonyManager::class.java)
        return tm.subscriberId
    }

    fun typed(): String? {
        val tm: TelephonyManager? = registry.find()
        return tm?.deviceId
    }
}
