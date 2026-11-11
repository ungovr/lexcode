// lexcode-expect: 1
// A wildcard import of an analytics package in a file where no capitalized vendor name appears; only the lowercase package names it.
package demo.android

import com.amplitude.android.*

class PackageOnlyThree(private val client: Any) {
    fun send() {
        client.track("Opened")
    }
}
