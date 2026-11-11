// lexcode-expect: 2
// The same reads through wildcard imports of the advertising id and telephony packages.
package demo.android

import android.content.Context
import android.telephony.*
import com.google.android.gms.ads.identifier.*

class WildIds(private val context: Context, private val telephony: TelephonyManager) {
    suspend fun advertising(): String? = AdvertisingIdClient.getAdvertisingIdInfo(context).id

    fun imei(): String? = telephony.imei
}
