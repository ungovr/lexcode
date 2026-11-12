// lexcode-expect: 1
// The advertising id client through a wildcard import of Google's package.
package demo.android

import android.content.Context
import com.google.android.gms.ads.identifier.*

class WildIds(private val context: Context) {
    suspend fun advertising(): String? = AdvertisingIdClient.getAdvertisingIdInfo(context).id
}
