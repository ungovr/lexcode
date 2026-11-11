// lexcode-expect: 21
// Reading an identifier that follows one Android device: the advertising id, the IMEI, MEID,
// subscriber id and SIM serial (as properties and as getters), the hardware serial, and the Firebase
// installation id (through the KTX property and the instance). The telephony receiver is declared as
// a TelephonyManager in each of the ways an app does it.
package demo.android

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.telephony.TelephonyManager
import com.google.android.gms.ads.identifier.AdvertisingIdClient
import com.google.firebase.Firebase
import com.google.firebase.installations.FirebaseInstallations
import com.google.firebase.installations.installations

@SuppressLint("HardwareIds", "MissingPermission")
class DeviceIds(private val context: Context, private val telephony: TelephonyManager) {
    suspend fun advertising(): String? =
        AdvertisingIdClient.getAdvertisingIdInfo(context).id

    fun telephonyProperties(): List<String?> =
        listOf(telephony.imei, telephony.meid, telephony.deviceId, telephony.subscriberId, telephony.simSerialNumber)

    fun telephonyGetters(): List<String?> =
        listOf(telephony.getImei(0), telephony.getSubscriberId())

    fun serial(): String = Build.getSerial()

    fun installationId() = FirebaseInstallations.getInstance().id

    fun ktxInstallationId() = Firebase.installations.id
}

class PublicProperty(val tm: TelephonyManager) {
    fun imei(): String? = tm.imei
}

class MutableProperty(var tm: TelephonyManager) {
    fun meid(): String? = tm.meid
}

class Parameters {
    fun imei(manager: TelephonyManager): String? = manager.imei

    fun subscriber(manager: TelephonyManager) = manager.subscriberId
}

class Lookups(private val context: Context) {
    fun literal(): String? {
        val tm = context.getSystemService(TelephonyManager::class.java)
        return tm.simSerialNumber
    }
}

fun topLevel(tm: TelephonyManager): String? {
    val x = tm.imei
    return x
}

class BlockBody {
    fun subscriber(manager: TelephonyManager): String? {
        val id = manager.getSubscriberId()
        return id
    }
}

class LateInit {
    lateinit var tm: TelephonyManager

    fun serial(): String? = tm.simSerialNumber
}

class Nullable(private val context: Context) {
    private val reader: TelephonyManager? = findReader()
    private var cached: TelephonyManager? = null

    private fun findReader(): TelephonyManager? = null

    fun read(): String? = reader?.deviceId

    fun again(): String? = cached?.meid
}
