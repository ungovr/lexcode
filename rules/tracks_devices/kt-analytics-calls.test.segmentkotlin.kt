// lexcode-expect: 4
// Segment's Kotlin SDK: the client constructor and the track, identify and screen calls.
package demo.android

import android.content.Context
import com.segment.analytics.kotlin.android.Analytics
import com.segment.analytics.kotlin.core.emptyJsonObject

class SegmentKotlin(context: Context) {
    private val analytics = Analytics("write-key", context) {
        trackApplicationLifecycleEvents = true
    }

    fun send() {
        analytics.track("Opened", emptyJsonObject)
        analytics.identify("u1")
        analytics.screen("Home")
    }
}
