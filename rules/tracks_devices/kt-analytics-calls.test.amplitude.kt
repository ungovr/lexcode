// lexcode-expect: 3
// Amplitude's Kotlin SDK: the client constructor and a tracked event, and the earlier client's logEvent.
package demo.android

import android.content.Context
import com.amplitude.android.Amplitude
import com.amplitude.android.Configuration

class AmplitudeTracker(context: Context) {
    private val amplitude = Amplitude(Configuration(apiKey = "key", context = context))

    fun send() {
        amplitude.track("Opened")
    }

    fun legacy(client: Amplitude) {
        client.logEvent("Opened")
    }
}
