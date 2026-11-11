// lexcode-expect: 5
package example.pages

import it.skrape.core.htmlDocument
import it.skrape.fetcher.BrowserFetcher
import it.skrape.fetcher.HttpFetcher
import it.skrape.fetcher.response
import it.skrape.fetcher.skrape
import it.skrape.selects.html5.title

class PriceScraper {
    fun competitorTitle(): String = skrape(HttpFetcher) {
        request {
            url = "https://example.com/products"
        }
        response { htmlDocument { title { findFirst { text } } } }
    }

    fun forPage(pageUrl: String): String = skrape(HttpFetcher) {
        request {
            url = pageUrl
            timeout = 5000
        }
        response { htmlDocument { title { findFirst { text } } } }
    }

    fun rendered(pageUrl: String) = skrape(BrowserFetcher) {
        request {
            url = pageUrl
        }
        response { htmlDocument { title { findFirst { text } } } }
    }

    fun many(urls: List<String>) {
        for (u in urls) {
            skrape(HttpFetcher) {
                request { url = u }
                response { status { code } }
            }
        }
    }

    // Short form of the same call.
    fun withHeaders(pageUrl: String) = skrape(HttpFetcher) {
        request {
            url = pageUrl
            headers = mapOf("Accept" to "text/html")
        }
    }

    // The project's own server under test, never a third party's.
    fun healthPage(): String = skrape(HttpFetcher) {
        request {
            url = "http://localhost:8080/health"
        }
        response { htmlDocument { title { findFirst { text } } } }
    }

    fun loopback(): Int = skrape(HttpFetcher) {
        request {
            url = "http://127.0.0.1:8080/status"
        }
        response { status { code } }
    }

    // Parsing markup the app already holds does not fetch anything.
    fun parseOnly(html: String): String = htmlDocument(html) { title { findFirst { text } } }
}
