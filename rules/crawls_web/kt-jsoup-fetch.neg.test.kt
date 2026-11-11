// lexcode-expect: 0
package example.pages

import com.fleeksoft.ksoup.Ksoup
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import java.io.File
import java.net.URL

class Connector {
    // Parsing markup the app already holds, or a file on disk, is not fetching a page.
    fun fromString(html: String): String = Jsoup.parse(html).title()

    fun fromFile(path: String): String = Jsoup.parse(File(path), "UTF-8").title()

    fun fromHtmlWithBase(html: String): String = Jsoup.parse(html, "https://example.com/").title()

    // The sanitizer works on a string too.
    fun sanitize(comment: String): String = Jsoup.clean(comment, Safelist.basic())

    // The project's own server, never a third party's.
    fun ownApi(): String = Jsoup.connect("http://localhost:8080/health").get().text()

    fun ownLoopback(): String = Jsoup.connect("http://127.0.0.1:8080/health").get().text()

    suspend fun ownKsoup(): String = Ksoup.parseGetRequest(url = "http://localhost:8080/health").title()

    suspend fun ownKsoupPositional(): String = Ksoup.parseGetRequest("http://127.0.0.1:8080/health").title()

    fun ownIpv6(): String = Jsoup.connect("http://[::1]:8080/health").get().text()

    fun ownUrlParse(): String = Jsoup.parse(URL("http://localhost:8080/page"), 3000).title()

    // A project method that happens to be called connect.
    fun connect(host: String): Boolean = host.isNotEmpty()

    fun useIt(): Boolean = this.connect("db-1")
}
