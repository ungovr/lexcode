// lexcode-expect: 0
// An object of the app's own named Secure, in a file that does not import Android's Settings.Secure,
// read and sent in a header. The name is not Android's.
package demo.fleet

import okhttp3.Request

object Secure {
    const val ANDROID_ID: String = "android_id"

    fun getString(resolver: Any?, name: String): String = "$resolver-$name"
}

class FleetClient {
    fun send(): Request {
        val id = Secure.getString(null, Secure.ANDROID_ID)
        return Request.Builder().url("https://api.example.com/v1/ping").addHeader("X-Device", id).build()
    }
}
