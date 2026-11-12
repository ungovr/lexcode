// lexcode-expect: 16
// Third-party analytics, attribution and crash-reporting calls in an Android app: Firebase Analytics
// (the KTX property, getInstance, a logEvent with a trailing lambda, user id and user property),
// Crashlytics user ids, Sentry and Bugsnag start-up, Meta app events, AppsFlyer, Adjust and the
// Google Analytics collect endpoint.
package demo.android

import android.app.Application
import android.os.Bundle
import com.adjust.sdk.AdjustConfig
import com.appsflyer.AppsFlyerLib
import com.bugsnag.android.Bugsnag
import com.facebook.appevents.AppEventsLogger
import com.google.firebase.Firebase
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.analytics.analytics
import com.google.firebase.analytics.logEvent
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.google.firebase.crashlytics.crashlytics
import io.sentry.android.core.SentryAndroid
import javax.inject.Inject

class FirebaseHelper @Inject constructor(
    private val firebaseAnalytics: FirebaseAnalytics,
    private val crashlytics: FirebaseCrashlytics,
) {
    fun event(type: String) {
        firebaseAnalytics.logEvent(type) {
            param("source", "home")
        }
    }

    fun legacyEvent() {
        firebaseAnalytics.logEvent("open", Bundle())
    }

    fun user(id: String) {
        firebaseAnalytics.setUserId(id)
        firebaseAnalytics.setUserProperty("plan", "free")
        crashlytics.setUserId(id)
    }

    fun ktx(id: String) {
        Firebase.crashlytics.setUserId(id)
        FirebaseCrashlytics.getInstance().setUserId(id)
    }
}

class Providers {
    fun analytics(app: Application): FirebaseAnalytics = Firebase.analytics

    fun instance(app: Application): FirebaseAnalytics = FirebaseAnalytics.getInstance(app)
}

class Startup {
    fun init(app: Application) {
        SentryAndroid.init(app) { options -> options.dsn = "https://key@example.ingest.sentry.io/1" }
        Bugsnag.start(app)
        AppEventsLogger.newLogger(app)
        AppsFlyerLib.getInstance().init("dev-key", null, app)
        AppsFlyerLib.getInstance().start(app)
        AdjustConfig(app, "app-token", AdjustConfig.ENVIRONMENT_PRODUCTION)
    }

    val collect = "https://www.google-analytics.com/mp/collect?measurement_id=G-1&api_secret=s"
}
