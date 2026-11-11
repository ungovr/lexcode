// lexcode-expect: 1
// The advertising id client through a wildcard import of AndroidX's package.
package demo.android

import android.content.Context
import androidx.ads.identifier.*

class WildAndroidxIds(private val context: Context) {
    fun advertising() = AdvertisingIdClient.getAdvertisingIdInfo(context)
}
