// lexcode-expect: 11
// Reading an identifier that follows one Android device: the advertising id, the IMEI, MEID,
// subscriber id and SIM serial (as properties and as getters), the hardware serial, and the Firebase
// installation id (through the KTX property and the instance).
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
