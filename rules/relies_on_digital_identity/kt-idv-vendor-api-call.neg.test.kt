// lexcode-expect: 0
// Calls to other APIs, and a vendor named in a log line, a constant or a documentation link
// without anything being called. Stripe's payments API and an identity vendor's marketing site
// are not identity-verification calls.
package demo.http

import android.util.Log
import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.post
import java.net.URL
import okhttp3.Request
import retrofit2.Retrofit

class Calls(private val http: HttpClient) {
  companion object {
    private const val RETIRED = "https://api.onfido.com/v3.6/checks"
  }

  fun own(userId: String): Request =
      Request.Builder().url("https://api.example.org/v1/users/$userId").build()

  suspend fun charge(): String = http.post("https://api.stripe.com/v1/payment_intents")

  fun mention() {
    Log.i("calls", "we no longer use https://api.sumsub.com/resources/applicants")
    Log.i("calls", "docs: https://documentation.onfido.com/")
  }

  suspend fun blog(): String = http.get("https://www.yoti.com/blog/")

  fun retrofit(): Retrofit = Retrofit.Builder().baseUrl("https://api.example.org/v2/").build()

  fun pageToOpen(): URL = URL("https://www.veriff.com/about")
}
