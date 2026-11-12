// lexcode-expect: 0
package example.seo;

import com.redfin.sitemapgenerator.WebSitemapGenerator;
import java.io.File;
import java.io.IOException;
import java.util.List;

// The project's own classes that share a name with a crawler library's, and the other direction:
// publishing the site's own sitemap and robots.txt, which crawls nothing.
public class SitemapPublisher {

    public void write(List<String> ownPaths) throws IOException {
        WebSitemapGenerator generator = WebSitemapGenerator.builder("https://www.example.org", new File("build/sitemap")).build();
        for (String path : ownPaths) {
            generator.addUrl("https://www.example.org" + path);
        }
        generator.write();
    }

    public String robots() {
        return "User-agent: *\nDisallow: /admin/\nSitemap: https://www.example.org/sitemap.xml\n";
    }
}

// Not the library's classes: a toy domain model with the same simple names.
class WebCrawler {
    String name;
}

class CrawlController {
    CrawlController(String a, String b, String c) {
    }
}

class SiteMapParser {
    SiteMapParser(boolean strict) {
    }
}

class Spider {
    static Spider create(Object processor) {
        return new Spider();
    }
}

class FetcherBolt {
}

class ExampleUse {
    Object build() {
        new CrawlController("a", "b", "c");
        new SiteMapParser(false);
        new FetcherBolt();
        return Spider.create(new Object());
    }
}

class BoardGameCrawler extends WebCrawler {
    int dungeonDepth;
}
