// lexcode-expect: 1
// The Android id as the Firebase Analytics user id, through a wildcard import of its package.
package demo.android

import android.content.Context
import android.provider.Settings
import com.google.firebase.analytics.*

class WildFirebase(private val context: Context, private val analytics: FirebaseAnalytics) {
    fun send() {
        val id = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        analytics.setUserId(id)
    }
}
