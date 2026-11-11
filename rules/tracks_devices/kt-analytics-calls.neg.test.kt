// lexcode-expect: 0
// Calls that look like analytics but are not a third-party tracking service: server-side error
// capture, Micrometer counters, other Firebase products (auth, Firestore, messaging), an app-owned
// Analytics class and AuditTrail class with the vendors' method names, and Lombok-style builders
// named like Segment's messages. The file imports no analytics vendor.
package demo.metrics

import com.google.firebase.Firebase
import com.google.firebase.auth.auth
import com.google.firebase.firestore.firestore
import com.google.firebase.messaging.FirebaseMessaging
import io.micrometer.core.instrument.MeterRegistry
import io.sentry.Sentry

// An app-owned class with Segment's and Amplitude's method names.
class Analytics(private val sink: MutableList<String>) {
    fun track(event: String) {
        sink.add(event)
    }

    fun identify(user: String) {
        sink.add(user)
    }

    fun screen(name: String) {
        sink.add(name)
    }

    fun logEvent(name: String) {
        sink.add(name)
    }

    fun setUserId(id: String) {
        sink.add(id)
    }

    fun setUserProperty(name: String, value: String) {
        sink.add("$name=$value")
    }
}

class AuditTrail {
    fun track(action: String) = println(action)
    fun logEvent(action: String) = println(action)
}

// Builders named like Segment's message builders, in a file with no Segment import.
class TrackMessage private constructor(val event: String) {
    companion object {
        fun builder(event: String) = TrackMessage(event)
    }
}

class PageMessage private constructor(val name: String) {
    companion object {
        fun builder(name: String) = PageMessage(name)
    }
}

// App-owned classes named like the vendors'.
class Amplitude(val key: String) {
    fun track(event: String) = println("$key $event")
}

object Pendo {
    fun track(event: String) = println(event)
}

class Service(
    private val registry: MeterRegistry,
    private val analytics: Analytics,
    private val audit: AuditTrail,
    private val messaging: FirebaseMessaging,
) {
    fun handle() {
        // Server-side error capture and metrics are not tracking a device.
        Sentry.captureException(IllegalStateException("boom"))
        registry.counter("requests").increment()
        // Other Firebase products.
        Firebase.auth.signOut()
        Firebase.firestore.collection("notes")
        messaging.subscribeToTopic("news")
        // App-owned classes with the vendors' method names.
        analytics.track("page")
        analytics.identify("u1")
        analytics.screen("home")
        analytics.logEvent("open")
        analytics.setUserId("u1")
        analytics.setUserProperty("plan", "free")
        audit.track("login")
        audit.logEvent("login")
        Amplitude("k").track("signup")
        TrackMessage.builder("signup")
        PageMessage.builder("home")
        Pendo.track("click")
    }
}
