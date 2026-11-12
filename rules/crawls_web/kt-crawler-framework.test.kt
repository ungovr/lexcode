// lexcode-expect: 15
package example.crawl

import crawlercommons.robots.SimpleRobotRulesParser
import crawlercommons.sitemaps.SiteMapParser
import edu.uci.ics.crawler4j.crawler.CrawlConfig
import edu.uci.ics.crawler4j.crawler.CrawlController
import edu.uci.ics.crawler4j.crawler.WebCrawler
import edu.uci.ics.crawler4j.fetcher.PageFetcher
import edu.uci.ics.crawler4j.url.WebURL
import com.digitalpebble.stormcrawler.bolt.FetcherBolt
import com.digitalpebble.stormcrawler.bolt.JSoupParserBolt
import com.digitalpebble.stormcrawler.bolt.SimpleFetcherBolt
import com.digitalpebble.stormcrawler.bolt.SiteMapParserBolt
import org.apache.nutch.crawl.Generator
import org.apache.nutch.crawl.Injector
import org.apache.nutch.fetcher.Fetcher
import us.codecraft.webmagic.Page
import us.codecraft.webmagic.Spider
import us.codecraft.webmagic.processor.PageProcessor

// crawler4j
class SiteCrawler : WebCrawler() {
    override fun shouldVisit(referringPage: edu.uci.ics.crawler4j.crawler.Page, url: WebURL): Boolean =
        url.url.startsWith("https://example.com/")
}

class ConfiguredCrawler(private val depth: Int) : WebCrawler() {
    override fun shouldVisit(referringPage: edu.uci.ics.crawler4j.crawler.Page, url: WebURL): Boolean = depth > 0
}

fun start(config: CrawlConfig, fetcher: PageFetcher, robots: edu.uci.ics.crawler4j.robotstxt.RobotstxtServer) {
    val controller = CrawlController(config, fetcher, robots)
    controller.addSeed("https://example.com/")
    controller.start(SiteCrawler::class.java, 4)
}

fun anonymous(): WebCrawler = object : WebCrawler() {
    override fun shouldVisit(referringPage: edu.uci.ics.crawler4j.crawler.Page, url: WebURL): Boolean = true
}

// WebMagic
class ProductProcessor : PageProcessor {
    override fun process(page: Page) {
        page.putField("title", page.html.xpath("//title/text()").toString())
    }

    override fun getSite() = us.codecraft.webmagic.Site.me()
}

fun spin() {
    Spider.create(ProductProcessor()).addUrl("https://example.com/products").thread(5).run()
}

// crawler-commons
val sitemaps = SiteMapParser(false)
val robots = SimpleRobotRulesParser()

// Apache Nutch
fun nutch(conf: org.apache.hadoop.conf.Configuration) {
    Injector(conf)
    Generator(conf)
    Fetcher(conf)
}

// StormCrawler
fun bolts() = listOf(FetcherBolt(), SimpleFetcherBolt(), JSoupParserBolt(), SiteMapParserBolt())
