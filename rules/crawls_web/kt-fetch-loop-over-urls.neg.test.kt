// lexcode-expect: 0
package example.sync

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.header
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.net.URI
import java.net.URL
import java.net.http.HttpClient as JdkHttpClient
import java.net.http.HttpRequest
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

class OwnApiClient(
    private val client: HttpClient,
    private val ok: OkHttpClient,
    private val http: JdkHttpClient,
    private val cache: MutableMap<String, String>,
    private val httpHeaders: Map<String, String>,
) {
    private val base = "http://localhost:8080"

    // The project's own API: the loop variable is an id, and the URL is built from a base.
    suspend fun pullItems(itemIds: List<String>) {
        for (id in itemIds) {
            client.get("$base/api/items/$id")
        }
    }

    suspend fun pullWithConcatenation(ids: List<Long>) {
        ids.forEach { id -> client.get(base + "/api/items/" + id) }
    }

    suspend fun pullWithTemplate(ids: List<Long>) {
        ids.forEach { client.get("http://localhost:8080/api/items/$it") }
    }

    suspend fun pullWithOkHttp(ids: List<String>) {
        for (id in ids) {
            val request = Request.Builder().url("http://127.0.0.1:8080/api/items/$id").build()
            ok.newCall(request).execute().close()
        }
    }

    suspend fun parallel(ids: List<String>) = coroutineScope {
        ids.map { id -> async { client.get("$base/api/items/$id") } }
    }

    // One documented partner API call, not in a loop.
    suspend fun repoInfo() = client.get("https://api.github.com/repos/jetbrains/kotlin")

    // A single value handed to a scope function is not a list of pages.
    suspend fun oneValue(endpoint: String) {
        endpoint.let { client.get(it) }
        endpoint.also { client.get(it) }
        endpoint.takeIf { it.isNotEmpty() }
    }

    suspend fun oneEndpoint(endpoint: String?) {
        endpoint?.let { client.get(it) }
        endpoint?.also { client.get(it) }
        endpoint.takeIf { it != null }?.let { println(it) }
    }

    // The loop variable is looked up or printed, never fetched.
    fun lookups(urls: List<String>) {
        for (url in urls) {
            val hit = cache.get(url)
            println("$url -> $hit")
        }
        urls.forEach { println(httpHeaders.get(it)) }
        urls.map { cache.get(it) }
    }

    fun hosts(urls: List<String>) {
        urls.forEach { u -> println(URI.create(u).host) }
        urls.forEach { println(URI(it).host) }
    }

    // Local files opened with a loop variable.
    fun sizes(paths: List<String>): Long {
        var total = 0L
        for (p in paths) {
            total += URL("file:$p").readBytes().size
            total += File(p).readText().length
        }
        return total
    }

    fun ids(urls: List<String>) {
        for (u in urls) {
            val request = HttpRequest.newBuilder(URI.create("http://localhost:8080/ping")).build()
            http.send(request, java.net.http.HttpResponse.BodyHandlers.discarding())
        }
    }
}
