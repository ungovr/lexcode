// lexcode-expect: 0
// Device information that does not follow one device: other secure settings, the model and carrier
// name, SIM state, a random id made in the process, the installation token (not the id), an Android
// id compared with a value on the device, an app-owned class named like Google's, and an app-owned
// record read for deviceId, subscriberId and imei in a file that does import TelephonyManager.
package demo.android

import android.content.Context
import android.os.Build
import android.provider.Settings
import android.telephony.TelephonyManager
import com.google.firebase.installations.FirebaseInstallations
import java.util.UUID

// Not the advertising id client: the file imports neither Google's nor AndroidX's.
object AdvertisingIdClient {
    fun getAdvertisingIdInfo(context: Context): String = "none"
}

// An app-owned handset record with the telephony names, in a file that imports TelephonyManager.
class Handset(val deviceId: String, val subscriberId: String, val imei: String)

class Fleet(private val telephony: TelephonyManager) {
    fun owned(device: Handset): String = device.deviceId + device.subscriberId

    fun network(manager: TelephonyManager, device: Handset): String = "${manager.networkType} ${device.imei}"

    fun cast(context: Context, device: Handset): String {
        val manager = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        return "${manager.networkType} ${device.deviceId}"
    }
}

class DeviceInfo(private val context: Context, private val telephony: TelephonyManager) {
    fun describe(): String {
        val model = Build.MODEL + " " + Build.MANUFACTURER
        val carrier = telephony.networkOperatorName
        val simState = telephony.simState
        val input = Settings.Secure.getString(context.contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
        val brightness = Settings.System.getInt(context.contentResolver, Settings.System.SCREEN_BRIGHTNESS)
        return "$model $carrier $simState $input $brightness"
    }

    fun session(): String = UUID.randomUUID().toString()

    fun token() = FirebaseInstallations.getInstance().getToken(false)

    fun adInfo(): String = AdvertisingIdClient.getAdvertisingIdInfo(context)

    // The Android id compared with a known lab device, never sent anywhere.
    fun isLabDevice(): Boolean {
        val id = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        return "test-lab-device" == id
    }
}
