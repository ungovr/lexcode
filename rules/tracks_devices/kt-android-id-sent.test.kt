// lexcode-expect: 12
// The Android id read and sent off the device: in an HTTP header, on a form, in a query string, in a
// Ktor request, and to an analytics or crash SDK as the user id.
package demo.android

import android.app.Activity
import android.net.Uri
import android.provider.Settings
import android.provider.Settings.Secure
import com.appsflyer.AppsFlyerLib
import com.google.firebase.Firebase
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.analytics.analytics
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.mixpanel.android.mpmetrics.MixpanelAPI
import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import java.net.HttpURLConnection
import okhttp3.FormBody
import okhttp3.HttpUrl
import okhttp3.Request

class UploadActivity : Activity() {
    fun header(): Request {
        val id = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        return Request.Builder().url("https://api.example.com/v1/ping").addHeader("X-Device", id).build()
    }

    fun legacy(connection: HttpURLConnection) {
        val id = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        connection.setRequestProperty("X-Device", id)
    }

    fun form(): FormBody {
        val id = Secure.getString(contentResolver, Secure.ANDROID_ID)
        return FormBody.Builder().add("device", id).build()
    }

    fun query(): Uri {
        val id = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        return Uri.parse("https://api.example.com/ping").buildUpon().appendQueryParameter("device", id).build()
    }

    fun sdk(analytics: FirebaseAnalytics) {
        analytics.setUserId(Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID))
    }

    fun ktx() {
        Firebase.analytics.setUserId(Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID))
    }

    suspend fun ktor(client: HttpClient) {
        val id = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        client.get("https://api.example.com/v1/ping") {
            header("X-Device", id)
            parameter("device", id)
        }
    }

    fun more(crash: FirebaseCrashlytics, mixpanel: MixpanelAPI) {
        val id = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
        crash.setUserId(id)
        mixpanel.identify(id)
        AppsFlyerLib.getInstance().setCustomerUserId(id)
        HttpUrl.parse("https://api.example.com/ping")?.newBuilder()?.addQueryParameter("device", id)
    }
}
