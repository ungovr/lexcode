// lexcode-expect: 1
// Segment's earlier Android client through a wildcard import of its package.
package demo.android

import android.content.Context
import com.segment.analytics.*

class WildSegmentJava(private val context: Context) {
    fun client(): Analytics = Analytics.with(context)
}
