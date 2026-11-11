// lexcode-expect: 7
// Segment's JVM libraries: the server-side message builders and the earlier Android client.
package demo.server

import android.content.Context
import com.segment.analytics.Analytics
import com.segment.analytics.messages.IdentifyMessage
import com.segment.analytics.messages.PageMessage
import com.segment.analytics.messages.ScreenMessage
import com.segment.analytics.messages.TrackMessage

class SegmentSender {
    fun messages() {
        TrackMessage.builder("Signed Up").userId("u1")
        IdentifyMessage.builder().userId("u1")
        ScreenMessage.builder("Home").userId("u1")
        PageMessage.builder("Pricing").userId("u1")
    }

    fun android(context: Context, analytics: Analytics) {
        Analytics.with(context).track("Opened")
        analytics.screen("Home")
    }
}
