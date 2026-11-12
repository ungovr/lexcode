// lexcode-expect: 1
// A declared TelephonyManager receiver, with the telephony package imported by wildcard.
package demo.android

import android.telephony.*

class WildTelephony(private val tm: TelephonyManager) {
    fun imei(): String? = tm.imei
}
