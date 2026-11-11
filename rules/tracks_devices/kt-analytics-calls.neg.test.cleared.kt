// lexcode-expect: 0
// Clearing the user id of the Firebase SDKs, which is the opposite of following the device: an empty
// string or null on a receiver, on the KTX property and on the instance.
package demo.android

import com.google.firebase.Firebase
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.google.firebase.crashlytics.crashlytics

class SignOut(private val analytics: FirebaseAnalytics, private val crash: FirebaseCrashlytics) {
    fun clearOnReceivers() {
        analytics.setUserId(null)
        analytics.setUserId("")
        crash.setUserId("")
    }

    fun clearOnKtx() {
        Firebase.crashlytics.setUserId("")
        Firebase.crashlytics.setUserId(null)
    }

    fun clearOnInstance() {
        FirebaseCrashlytics.getInstance().setUserId("")
        FirebaseCrashlytics.getInstance().setUserId(null)
    }
}
