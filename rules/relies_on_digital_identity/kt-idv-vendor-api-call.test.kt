// lexcode-expect: 8
// Calling an identity-verification vendor's API directly: the JDK HttpClient, Spring's
// RestTemplate and WebClient, OkHttp, Apache HttpClient, Retrofit and Ktor.
package demo.http

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.request
import java.net.URI
import java.net.http.HttpRequest
import okhttp3.Request
import org.apache.http.client.methods.HttpPost
import org.springframework.web.client.RestTemplate
import org.springframework.web.reactive.function.client.WebClient
import retrofit2.Retrofit

class VendorCalls(private val http: HttpClient) {
  fun sumsubApplicant(body: String): HttpRequest =
      HttpRequest.newBuilder(URI.create("https://api.sumsub.com/resources/applicants?levelName=basic-kyc-level"))
          .POST(HttpRequest.BodyPublishers.ofString(body))
          .build()

  fun onfidoCheck(rest: RestTemplate, body: String): String? =
      rest.postForObject("https://api.eu.onfido.com/v3.6/checks", body, String::class.java)

  fun personaClient(): WebClient = WebClient.create("https://withpersona.com/api/v1")

  fun jumioAccount(token: String): Request =
      Request.Builder().url("https://account.amer-1.jumio.ai/api/v1/accounts").header("Authorization", token).build()

  fun yoti(): HttpPost = HttpPost("https://api.yoti.com/ai/v1/age")

  fun veriffRetrofit(): Retrofit = Retrofit.Builder().baseUrl("https://stationapi.veriff.com/v1/").build()

  suspend fun veriffSession(): String = http.post("https://stationapi.veriff.com/v1/sessions") { }

  suspend fun idnowStatus(): String = http.get("""https://gateway.idnow.io/api/v1/status""")
}
