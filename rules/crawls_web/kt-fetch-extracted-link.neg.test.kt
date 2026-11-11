// lexcode-expect: 0
package example.links

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import org.jsoup.nodes.Document
import org.jsoup.nodes.Element
import java.net.URI
import java.net.URL

class LinkReport(
    private val client: HttpClient,
    private val cache: MutableMap<String, String>,
    private val httpHeaders: Map<String, String>,
) {
    // Collecting or resolving links without fetching them.
    fun collect(doc: Document): List<String> = doc.select("a[href]").map { it.absUrl("href") }

    fun resolve(base: URL, a: Element): URL = URL(base, a.attr("href"))

    fun host(a: Element): String? = URI.create(a.attr("href")).host

    fun images(doc: Document): List<String> {
        val out = mutableListOf<String>()
        for (img in doc.select("img")) {
            out.add(img.attr("src"))
            println(img.absUrl("src"))
        }
        return out
    }

    // The project's own site: a loopback base plus an href.
    suspend fun ownSite(doc: Document) {
        for (a in doc.select("a[href]")) {
            client.get("http://localhost:8080" + a.attr("href"))
            client.get("http://localhost:8080${a.attr("href")}")
        }
    }

    // A feed URL taken from configuration, and attributes that are not links.
    suspend fun configured(feedUrl: String, a: Element) {
        client.get(feedUrl)
        client.get(a.attr("title"))
        client.get(a.attr("data-id"))
        client.get(a.text())
    }

    // Lookups keyed by a link are not fetches.
    fun lookups(a: Element): String? {
        println(httpHeaders.get(a.attr("href")))
        return cache.get(a.absUrl("href"))
    }
}
