// lexcode-expect: 1
// The Android id on a form, through a wildcard import of OkHttp.
package demo.android

import android.content.Context
import android.provider.Settings
import okhttp3.*

class WildOkHttp(private val context: Context) {
    fun send(): FormBody {
        val id = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        return FormBody.Builder().add("device", id).build()
    }
}
