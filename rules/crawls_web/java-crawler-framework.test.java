// lexcode-expect: 12
package example.crawl;

import com.digitalpebble.stormcrawler.bolt.FetcherBolt;
import com.digitalpebble.stormcrawler.bolt.JSoupParserBolt;
import com.digitalpebble.stormcrawler.bolt.SiteMapParserBolt;
import crawlercommons.robots.SimpleRobotRulesParser;
import crawlercommons.sitemaps.SiteMapParser;
import edu.uci.ics.crawler4j.crawler.CrawlConfig;
import edu.uci.ics.crawler4j.crawler.CrawlController;
import edu.uci.ics.crawler4j.crawler.Page;
import edu.uci.ics.crawler4j.crawler.WebCrawler;
import edu.uci.ics.crawler4j.fetcher.PageFetcher;
import edu.uci.ics.crawler4j.robotstxt.RobotstxtConfig;
import edu.uci.ics.crawler4j.robotstxt.RobotstxtServer;
import edu.uci.ics.crawler4j.url.WebURL;
import org.apache.nutch.crawl.Generator;
import org.apache.nutch.crawl.Injector;
import org.apache.nutch.fetcher.Fetcher;
import us.codecraft.webmagic.Site;
import us.codecraft.webmagic.Spider;
import us.codecraft.webmagic.processor.PageProcessor;

// crawler4j: a crawler class and the controller that runs it over seed sites.
public class ArticleCrawler extends WebCrawler {

    @Override
    public boolean shouldVisit(Page referringPage, WebURL url) {
        return url.getURL().toLowerCase().startsWith("https://news.example.com/");
    }

    @Override
    public void visit(Page page) {
        System.out.println(page.getWebURL().getURL());
    }

    public static void main(String[] args) throws Exception {
        CrawlConfig config = new CrawlConfig();
        config.setCrawlStorageFolder("/tmp/crawl");
        PageFetcher fetcher = new PageFetcher(config);
        RobotstxtServer robots = new RobotstxtServer(new RobotstxtConfig(), fetcher);
        CrawlController controller = new CrawlController(config, fetcher, robots);
        controller.addSeed("https://news.example.com/");
        controller.start(ArticleCrawler.class, 4);
    }
}

// WebMagic: a page processor and the spider that runs it.
class ListingProcessor implements PageProcessor {
    private final Site site = Site.me().setRetryTimes(3);

    @Override
    public void process(us.codecraft.webmagic.Page page) {
        page.addTargetRequests(page.getHtml().links().all());
    }

    @Override
    public Site getSite() {
        return site;
    }

    static void run() {
        Spider.create(new ListingProcessor()).addUrl("https://listings.example.org/").thread(5).run();
    }
}

// crawler-commons: the sitemap and robots.txt readers a crawler uses on other sites.
class SiteWalker {
    void sitemaps() {
        SiteMapParser parser = new SiteMapParser(false);
        SimpleRobotRulesParser robots = new SimpleRobotRulesParser();
    }
}

// Apache Nutch: the crawl cycle's own tools.
class NutchCycle {
    void run(org.apache.hadoop.conf.Configuration conf) {
        Injector injector = new Injector(conf);
        Generator generator = new Generator(conf);
        Fetcher fetcher = new Fetcher(conf);
    }
}

// StormCrawler: the bolts of a crawl topology.
class CrawlTopology {
    void wire(org.apache.storm.topology.TopologyBuilder builder) {
        builder.setBolt("fetch", new FetcherBolt(), 3);
        builder.setBolt("sitemap", new SiteMapParserBolt(), 1);
        builder.setBolt("parse", new JSoupParserBolt(), 4);
    }
}
