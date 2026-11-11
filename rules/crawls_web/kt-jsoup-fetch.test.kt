// lexcode-expect: 12
package example.pages

import com.fleeksoft.ksoup.Ksoup
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import java.net.URI
import java.net.URL

class PageDownloader {
    fun title(url: String): String = Jsoup.connect(url).get().title()

    fun withAgent(url: String): Document =
        Jsoup.connect(url)
            .userAgent("Mozilla/5.0")
            .timeout(10_000)
            .get()

    fun literal(): Document = Jsoup.connect("https://example.com/prices").get()

    fun post(url: String): Document = Jsoup.connect(url).data("q", "kotlin").post()

    fun stored(url: String) {
        val connection = Jsoup.connect(url)
        connection.execute()
    }

    fun viaUrl(url: String): Document = Jsoup.parse(URL(url), 5000)

    fun viaUri(url: String): Document = Jsoup.parse(URI.create(url).toURL(), 5000)

    suspend fun multiplatform(url: String): Document = Ksoup.parseGetRequest(url)

    suspend fun multiplatformNamed(url: String): Document = Ksoup.parseGetRequest(url = url)

    suspend fun multiplatformNamedLiteral(): Document = Ksoup.parseGetRequest(url = "https://example.com/prices")

    fun multiplatformBlocking(url: String): Document = Ksoup.parseGetRequestBlocking(url = url)

    fun multiplatformBlockingLiteral(): Document = Ksoup.parseGetRequestBlocking(url = "https://example.com/prices")
}
