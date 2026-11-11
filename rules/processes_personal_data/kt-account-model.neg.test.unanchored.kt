// lexcode-expect: 0
// The same call names in a file that never imports Spring Security: a tracker with formLogin and
// oauth2Login methods called on a receiver.
package demo.tracking

class LoginTracker {
    fun formLogin(name: String): String = name
    fun oauth2Login(name: String): String = name
}

class Tracked(private val tracker: LoginTracker) {
    fun record(): String {
        tracker.formLogin("anon")
        return tracker.oauth2Login("anon")
    }
}
