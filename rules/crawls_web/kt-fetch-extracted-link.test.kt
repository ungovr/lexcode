// lexcode-expect: 12
package example.links

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import okhttp3.OkHttpClient
import okhttp3.Request
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.jsoup.nodes.Document
import org.jsoup.nodes.Element
import org.springframework.web.client.RestTemplate
import org.springframework.web.reactive.function.client.WebClient
import java.net.URI
import java.net.URL
import java.net.http.HttpRequest

// Follows the links found on a page it has just read.
class LinkFollower(
    private val client: HttpClient,
    private val okHttp: OkHttpClient,
    private val rest: RestTemplate,
    private val webClient: WebClient,
) {
    suspend fun ktor(doc: Document) {
        doc.select("a[href]").forEach { client.get(it.absUrl("href")) }
    }

    suspend fun ktorAttr(a: Element) {
        client.get(a.attr("href"))
    }

    suspend fun ktorAbsAttr(a: Element) {
        client.get(a.attr("abs:href"))
    }

    fun jdkClient(a: Element) {
        HttpRequest.newBuilder(URI.create(a.absUrl("href"))).build()
    }

    fun jdkBuilder(a: Element) {
        HttpRequest.newBuilder().uri(URI.create(a.attr("abs:href"))).GET().build()
    }

    fun urlStream(a: Element) {
        URL(a.absUrl("href")).openStream().use { it.readBytes() }
    }

    fun urlConnection(img: Element) {
        URL(img.attr("src")).openConnection().connect()
    }

    fun urlText(a: Element): String = URL(a.absUrl("href")).readText()

    fun restTemplate(a: Element): String? = rest.getForObject(a.absUrl("href"), String::class.java)

    fun okHttp(a: Element) {
        okHttp.newCall(Request.Builder().url(a.absUrl("href")).build()).execute().close()
    }

    fun apache(a: Element) = HttpGet(a.absUrl("href"))

    fun webClient(a: Element) {
        webClient.get().uri(a.absUrl("href")).retrieve().bodyToMono(String::class.java).block()
    }
}
