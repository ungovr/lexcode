// lexcode-expect: 0
// Properties with the telephony names on classes of the app's own, in a file that imports neither
// TelephonyManager nor the Google advertising id client.
package demo.fleet

class Handset(val imei: String, val deviceId: String, val subscriberId: String) {
    fun getMeid(): String = imei
    fun getSimSerialNumber(): String = subscriberId
}

class Inventory(private val handset: Handset) {
    fun describe(): String {
        val a = handset.imei
        val b = handset.deviceId
        val c = handset.subscriberId
        val d = handset.getMeid()
        val e = handset.getSimSerialNumber()
        val f = handset.getImei()
        return "$a $b $c $d $e $f"
    }
}

fun Handset.getImei(): String = imei
