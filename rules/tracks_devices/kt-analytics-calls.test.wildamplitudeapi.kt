// lexcode-expect: 1
// Amplitude's earlier Android client through a wildcard import of its package.
package demo.android

import com.amplitude.api.*

class WildAmplitudeApi(private val client: AmplitudeClient) {
    fun send() {
        client.logEvent("Opened")
    }
}
