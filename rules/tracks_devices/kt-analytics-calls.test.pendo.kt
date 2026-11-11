// lexcode-expect: 3
// Pendo's mobile SDK: set-up, a visitor session and a tracked event.
package demo.android

import android.content.Context
import sdk.pendo.io.Pendo

class PendoTracker(private val context: Context) {
    fun start(token: String, visitorId: String) {
        Pendo.setup(context, token, null, null)
        Pendo.startSession(visitorId, "account", emptyMap(), emptyMap())
    }

    fun send(name: String) {
        Pendo.track(name, emptyMap())
    }
}
