// lexcode-expect: 0
// The Android id read and kept on the device: compared with a value, used as a local cache key,
// shown on screen, stored in the app's own preferences. Nothing here sends it to another host or to an
// analytics SDK, and a different secure setting is sent without being the Android id. The file
// imports neither OkHttp's FormBody nor Ktor's request helpers.
package demo.android

import android.app.Activity
import android.content.SharedPreferences
import android.provider.Settings
import android.provider.Settings.Secure
import android.widget.TextView

// An in-app diagnostics log with the vendors' method names.
class DiagnosticsLog {
    fun setUserId(id: String) = println(id)
    fun identify(id: String) = println(id)
}

class LocalIdActivity : Activity() {
    private val cache = HashMap<String, String>()
    private val tracker = DiagnosticsLog()

    // Compared with a known lab device.
    fun isLabDevice(): Boolean {
        val id = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        return "test-lab-device" == id
    }

    // A key for the app's own on-device cache.
    fun cached(name: String): String? {
        val key = "cache-" + Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        return cache[key + name]
    }

    // The same read through the imported Secure class, shown in a diagnostics screen.
    fun show(view: TextView) {
        val id = Secure.getString(contentResolver, Secure.ANDROID_ID)
        view.text = "device $id"
    }

    // Stored in the app's own preferences.
    fun remember(prefs: SharedPreferences) {
        val id = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        prefs.edit().putString("device", id).apply()
    }

    // Kept in a local list, and passed to helpers and a log of the app's own that only record it on screen.
    fun record(): List<String> {
        val id = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        val ids = ArrayList<String>()
        ids.add(id)
        header("X-Device", id)
        parameter("device", id)
        tracker.setUserId(id)
        tracker.identify(id)
        return ids
    }

    private fun header(name: String, value: String) = println("$name=$value")

    private fun parameter(name: String, value: String) = println("$name=$value")

    // Another setting through the same call, sent in a header and a form.
    fun input(): okhttp3.Request {
        val method = Settings.Secure.getString(contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
        okhttp3.FormBody.Builder().add("ime", method).build()
        return okhttp3.Request.Builder().url("https://api.example.com/v1/ping").addHeader("X-Input", method).build()
    }
}
