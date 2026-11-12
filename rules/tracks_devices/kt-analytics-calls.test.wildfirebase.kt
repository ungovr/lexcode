// lexcode-expect: 1
// Firebase Analytics reached through a wildcard import of its package.
package demo.android

import com.google.firebase.analytics.*

class WildFirebase(private val analytics: FirebaseAnalytics) {
    fun send() {
        analytics.logEvent("open", null)
    }
}
