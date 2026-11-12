// lexcode-expect: 1
// The Android id as the Crashlytics user id, through a wildcard import of its package.
package demo.android

import android.content.Context
import android.provider.Settings
import com.google.firebase.crashlytics.*

class WildCrash(private val context: Context, private val crash: FirebaseCrashlytics) {
    fun send() {
        val id = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        crash.setUserId(id)
    }
}
