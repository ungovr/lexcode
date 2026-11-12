// lexcode-expect: 14
package example.watcher

import com.gargoylesoftware.htmlunit.WebClient
import com.gargoylesoftware.htmlunit.html.HtmlPage
import com.microsoft.playwright.Page
import org.openqa.selenium.WebDriver
import org.openqa.selenium.chrome.ChromeDriver

class PageWatcher(
    private val driver: WebDriver,
    private val chromeDriver: ChromeDriver,
    private val page: Page,
    private val webClient: WebClient,
) {
    fun seleniumFor(urls: List<String>) {
        for (url in urls) {
            driver.get(url)
        }
    }

    fun seleniumNavigate(urls: List<String>) {
        for (url in urls) {
            driver.navigate().to(url)
        }
    }

    fun seleniumIndexed(count: Int) {
        for (i in 0 until count) {
            driver.get("https://example.com/page/$i")
        }
    }

    fun seleniumWhile(queue: ArrayDeque<String>) {
        while (queue.isNotEmpty()) {
            chromeDriver.get(queue.removeFirst())
        }
    }

    fun seleniumDoWhile(queue: ArrayDeque<String>) {
        do {
            driver.get(queue.removeFirst())
        } while (queue.isNotEmpty())
    }

    fun seleniumForEach(urls: List<String>) {
        urls.forEach { driver.get(it) }
    }

    fun seleniumSafeCall(urls: List<String>?) {
        urls?.forEach { driver.get(it) }
    }

    fun seleniumNamed(urls: List<String>) {
        urls.forEach { u -> driver.navigate().to(u) }
    }

    fun seleniumRepeat() {
        repeat(5) { n ->
            driver.get("https://example.com/feed?page=$n")
        }
    }

    fun playwrightFor(urls: List<String>) {
        for (url in urls) {
            page.navigate(url)
        }
    }

    fun playwrightForEach(urls: List<String>) {
        urls.forEach { page.navigate(it) }
    }

    fun playwrightMap(urls: List<String>) = urls.map { u ->
        page.navigate(u)
        page.content()
    }

    fun htmlUnitFor(urls: List<String>) {
        for (url in urls) {
            val loaded = webClient.getPage<HtmlPage>(url)
            println(loaded.titleText)
        }
    }

    fun htmlUnitPlain(urls: List<String>) {
        for (url in urls) {
            webClient.getPage(url)
        }
    }

    // The project's own app under test is a loopback address and is left alone.
    fun ownApp(paths: List<String>) {
        for (path in paths) {
            driver.get("http://localhost:8080$path")
        }
    }
}
