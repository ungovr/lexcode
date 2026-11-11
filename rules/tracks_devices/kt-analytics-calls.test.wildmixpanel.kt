// lexcode-expect: 1
// Mixpanel through a wildcard import of its package.
package demo.android

import com.mixpanel.android.mpmetrics.*

class WildMixpanel(private val mixpanel: MixpanelAPI) {
    fun send() {
        mixpanel.track("Opened")
    }
}
