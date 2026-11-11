// lexcode-expect: 1
// The Android id handed to Mixpanel identify, through a wildcard import of its package.
package demo.android

import android.content.Context
import android.provider.Settings
import com.mixpanel.android.mpmetrics.*

class WildMixpanel(private val context: Context, private val mixpanel: MixpanelAPI) {
    fun send() {
        val id = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        mixpanel.identify(id)
    }
}
