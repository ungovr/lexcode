// lexcode-expect: 1
// A wildcard import of an analytics package in a file where no capitalized vendor name appears; only the lowercase package names it.
package demo.android

import com.mixpanel.android.mpmetrics.*

class PackageOnlyOne(private val client: Any) {
    fun send() {
        client.track("Opened")
    }
}
