// lexcode-expect: 0
package example.internal

import com.redfin.sitemapgenerator.WebSitemapGenerator
import java.io.File

// Project classes that share a simple name with a crawling framework's, in a file that imports no
// crawling library. Each lines up with a pattern the rule reads in a file that does import one.
open class WebCrawler {
    open fun shouldVisit(url: String): Boolean = url.startsWith("https://example.com/docs/")
}

class DocsCrawler : WebCrawler() {
    override fun shouldVisit(url: String): Boolean = url.endsWith(".md")
}

class DocsCrawlerWithConfig(private val limit: Int) : WebCrawler() {
    override fun shouldVisit(url: String): Boolean = limit > 0
}

interface PageProcessor {
    fun process(page: String)
}

class TitleProcessor : PageProcessor {
    override fun process(page: String) = println(page)
}

class CrawlController(val folder: String, val depth: Int)

class SiteMapParser(val strict: Boolean)

class SimpleRobotRulesParser

class Spider(val name: String) {
    companion object {
        fun create(name: String) = Spider(name)
    }
}

class Injector(val dir: String)

class Generator(val dir: String)

class Fetcher(val dir: String)

class FetcherBolt(val name: String)

class SimpleFetcherBolt(val name: String)

class JSoupParserBolt(val name: String)

class SiteMapParserBolt(val name: String)

class Wiring {
    val controller = CrawlController("/tmp/c", 3)
    val parser = SiteMapParser(false)
    val robots = SimpleRobotRulesParser()
    val spider = Spider.create("docs")
    val injector = Injector("/tmp/crawl")
    val generator = Generator("/tmp/crawl")
    val fetcher = Fetcher("/tmp/crawl")
    val bolts = listOf(FetcherBolt("f"), SimpleFetcherBolt("s"), JSoupParserBolt("j"), SiteMapParserBolt("m"))

    // Publishing the site's own sitemap is not crawling anyone else's.
    fun ownSitemap(baseUrl: String, pages: List<String>) {
        val generator = WebSitemapGenerator(baseUrl, File("/var/www/public"))
        pages.forEach { generator.addUrl("$baseUrl/$it") }
        generator.write()
    }
}
