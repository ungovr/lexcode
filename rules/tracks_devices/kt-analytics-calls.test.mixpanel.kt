// lexcode-expect: 3
// Mixpanel: the shared instance, a direct constructor and an event.
package demo.android

import android.content.Context
import com.mixpanel.android.mpmetrics.MixpanelAPI
import org.json.JSONObject

class MixpanelTracker(private val context: Context) {
    fun shared(): MixpanelAPI = MixpanelAPI.getInstance(context, "token", false)

    fun direct(): MixpanelAPI = MixpanelAPI(context, "token", false)

    fun send(mixpanel: MixpanelAPI) {
        mixpanel.track("Opened", JSONObject())
    }
}
