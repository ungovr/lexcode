// lexcode-expect: 2
// Segment's server messages and Kotlin SDK reached through wildcard imports of their packages.
package demo.server

import com.segment.analytics.kotlin.android.*
import com.segment.analytics.messages.*

class WildSegment(private val analytics: Analytics) {
    fun send() {
        TrackMessage.builder("Signed Up").userId("u1")
        analytics.track("Opened")
    }
}
