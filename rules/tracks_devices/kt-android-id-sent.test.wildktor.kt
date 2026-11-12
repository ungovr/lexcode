// lexcode-expect: 2
// The Android id in a Ktor request, through a wildcard import of Ktor's request helpers.
package demo.android

import android.content.Context
import android.provider.Settings
import io.ktor.client.request.*

class WildKtor(private val context: Context) {
    fun send(): HttpRequestBuilder {
        val id = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        return HttpRequestBuilder().apply {
            header("X-Device", id)
            parameter("device", id)
        }
    }
}
