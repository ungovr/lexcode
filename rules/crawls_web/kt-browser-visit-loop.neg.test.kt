// lexcode-expect: 0
package example.e2e

import androidx.navigation.NavController
import org.openqa.selenium.WebDriver

interface PageRepository {
    fun getPage(number: Int): List<String>
}

class OwnAppChecks(
    private val driver: WebDriver,
    private val navController: NavController,
    private val baseUrl: String,
) {
    // One navigation with no loop.
    fun openOnce() {
        driver.get("https://example.com/pricing")
    }

    // The project's own app under test, a loopback address in a loop.
    fun smoke(paths: List<String>) {
        for (path in paths) {
            driver.get("http://localhost:8080$path")
        }
        for (path in paths) {
            driver.navigate().to("http://127.0.0.1:8080/$path")
        }
    }

    // A URL built from the configured base of the project's own site.
    fun ownPages(paths: List<String>) {
        for (path in paths) {
            driver.get("$baseUrl/$path")
        }
        for (path in paths) {
            driver.get("${baseUrl}/${path}")
        }
        paths.forEach { driver.navigate().to(baseUrl + it) }
    }

    // A scope function hands over one value; it is not a loop.
    fun single(url: String) {
        url.let { driver.get(it) }
        url.also { driver.navigate().to(it) }
    }

    // Loops that never navigate.
    fun readTitles(count: Int): List<String> {
        val titles = mutableListOf<String>()
        for (i in 0 until count) {
            titles.add(driver.title)
        }
        driver.get("https://example.com/")
        return titles
    }

    // Lists named like pages, and an Android navigation controller.
    fun lookups(itemsOnPage: List<String>, pages: Map<String, Int>, keys: List<String>, driverIds: List<Int>) {
        for (i in 0 until 3) {
            println(itemsOnPage.get(i))
        }
        for (key in keys) {
            println(pages.get(key))
        }
        for (i in 0 until 3) {
            println(driverIds.get(i))
        }
    }

    // Paging through the project's own repository, not a browser.
    fun pages(repo: PageRepository, count: Int) {
        for (n in 0 until count) {
            repo.getPage(n)
        }
        (1..count).forEach { repo.getPage(it) }
    }

    fun screens(routes: List<String>) {
        routes.forEach { route -> navController.navigate(route) }
        for (route in routes) {
            navController.navigate("detail/$route")
        }
    }
}
