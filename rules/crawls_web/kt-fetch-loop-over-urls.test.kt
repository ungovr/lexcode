// lexcode-expect: 30
package example.pricewatch

import com.github.kittinunf.fuel.Fuel
import com.github.kittinunf.fuel.httpGet
import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.head
import io.ktor.client.request.url
import io.ktor.http.Url
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.asFlow
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.springframework.web.client.RestTemplate
import org.springframework.web.reactive.function.client.WebClient
import java.net.URI
import java.net.URL
import java.net.http.HttpClient as JdkHttpClient
import java.net.http.HttpRequest

// A job that walks a list of pages held in a variable and downloads each one.
class RefreshListingsJob(
    private val client: HttpClient,
    private val okHttpClient: OkHttpClient,
    private val restTemplate: RestTemplate,
    private val webClient: WebClient,
    private val http: JdkHttpClient,
) {
    suspend fun ktorLoop(urls: List<String>) {
        for (url in urls) {
            client.get(url)
        }
    }

    suspend fun ktorNoBraces(urls: List<String>) {
        for (url in urls) client.head(url)
    }

    suspend fun ktorNamed(urls: List<String>) {
        for (url in urls) {
            client.get(urlString = url)
        }
    }

    suspend fun ktorWrapped(urls: List<String>) {
        urls.forEach { u -> client.get(Url(u)) }
    }

    suspend fun ktorBlock(urls: List<String>) {
        for (page in urls) {
            client.get { url(page) }
        }
    }

    suspend fun ktorTrailingLambda(urls: List<String>) {
        urls.forEach { u -> client.get(u) { headers.append("Accept", "text/html") } }
    }

    suspend fun implicitIt(urls: List<String>) {
        urls.forEach { client.get(it) }
    }

    suspend fun safeCall(urls: List<String>?) {
        urls?.forEach { client.get(it) }
    }

    suspend fun safeCallNamed(urls: List<String>?) {
        urls?.forEach { u -> client.get(u) }
    }

    suspend fun coroutines(urls: List<String>) = coroutineScope {
        urls.map { async { client.get(it) } }.awaitAll()
    }

    suspend fun launched(urls: List<String>) = coroutineScope {
        urls.forEach { launch { client.get(it) } }
    }

    suspend fun asFlowCollect(urls: List<String>) {
        urls.asFlow().collect { client.get(it) }
    }

    suspend fun withIndex(urls: List<String>) {
        urls.forEachIndexed { i, u ->
            println(i)
            client.get(u)
        }
    }

    fun jdkClient(urls: List<String>) {
        for (url in urls) {
            val request = HttpRequest.newBuilder(URI.create(url)).build()
            http.send(request, java.net.http.HttpResponse.BodyHandlers.ofString())
        }
    }

    fun jdkBuilder(pageUrls: List<String>) {
        for (pageUrl in pageUrls) {
            val request = HttpRequest.newBuilder().uri(URI(pageUrl)).GET().build()
            http.send(request, java.net.http.HttpResponse.BodyHandlers.ofString())
        }
    }

    fun readText(urls: List<String>) {
        for (link in urls) {
            println(URL(link).readText())
        }
    }

    fun readBytes(urls: List<String>) {
        urls.forEach { println(URL(it).readBytes().size) }
    }

    fun openStream(links: List<String>) {
        for (link in links) {
            URL(link).openStream().use { it.readBytes() }
        }
    }

    fun openConnection(links: List<String>) {
        for (link in links) {
            (URL(link).openConnection() as java.net.HttpURLConnection).inputStream.close()
        }
    }

    fun restTemplateLoop(urls: List<String>) {
        for (url in urls) {
            val body = restTemplate.getForObject(url, String::class.java)
            println(body?.length)
        }
    }

    fun restTemplateReified(urls: List<String>) {
        urls.forEach { restTemplate.getForObject<String>(it) }
    }

    fun restEntity(urls: List<String>) {
        urls.forEach { u -> restTemplate.getForEntity(u, String::class.java) }
    }

    fun restHead(urls: List<String>) {
        urls.forEach { u -> restTemplate.headForHeaders(u) }
    }

    fun okHttp(urls: List<String>) {
        for (url in urls) {
            val request = Request.Builder().url(url).build()
            okHttpClient.newCall(request).execute().close()
        }
    }

    fun webClientLoop(urls: List<String>) {
        for (url in urls) {
            webClient.get().uri(url).retrieve().bodyToMono(String::class.java).block()
        }
    }

    fun apacheClient(urls: List<String>) {
        for (url in urls) {
            println(HttpGet(url).uri)
        }
    }

    fun fuelGet(urls: List<String>) {
        for (url in urls) {
            Fuel.get(url).responseString()
        }
    }

    fun fuelExtension(urls: List<String>) {
        urls.forEach { it.httpGet().responseString() }
    }

    fun typedLambdaParameter(urls: List<String>) {
        urls.forEach { u: String -> restTemplate.getForObject(u, String::class.java) }
    }

    fun parallelSequence(urls: List<String>) {
        urls.asSequence().map { URL(it).readText() }.toList()
    }
}
