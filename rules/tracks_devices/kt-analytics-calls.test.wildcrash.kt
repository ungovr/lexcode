// lexcode-expect: 1
// A Crashlytics user id through a wildcard import of its package.
package demo.android

import com.google.firebase.crashlytics.*

class WildCrash(private val crash: FirebaseCrashlytics) {
    fun identify(id: String) {
        crash.setUserId(id)
    }
}
