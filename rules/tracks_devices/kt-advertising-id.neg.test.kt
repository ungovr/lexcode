// lexcode-expect: 0
// Device information that does not follow one device: other secure settings, the model and carrier
// name, SIM state, a random id made in the process, the installation token (not the id), an Android
// id compared with a value on the device, and an app-owned class named like Google's.
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
