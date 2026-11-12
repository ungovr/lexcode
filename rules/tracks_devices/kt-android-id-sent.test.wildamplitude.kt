// lexcode-expect: 1
// The Android id as the Amplitude user id, through a wildcard import of its package.
package demo.android

import android.content.Context
import android.provider.Settings
import com.amplitude.android.*

class WildAmplitude(private val context: Context, private val amplitude: Amplitude) {
    fun send() {
        val id = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        amplitude.setUserId(id)
    }
}
