// lexcode-expect: 8
package example.pages;

import java.io.IOException;
import java.net.URL;
import java.util.List;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

public class PagePuller {

    // A scraper that downloads other sites' pages and reads them with Jsoup.
    public Document news() throws IOException {
        return Jsoup.connect("https://www.example-times.com/world").get();
    }

    public Document byUrl(String url) throws IOException {
        return Jsoup.connect(url).userAgent("pricewatch/1.0").timeout(10_000).get();
    }

    public Document posted(String formUrl) throws IOException {
        return Jsoup.connect(formUrl).data("q", "laptops").post();
    }

    public Connection.Response raw(String pageUrl) throws IOException {
        return Jsoup.connect(pageUrl).followRedirects(true).execute();
    }

    public void many(List<String> links) throws IOException {
        for (String link : links) {
            Document d = Jsoup.connect(link).get();
            System.out.println(d.title());
        }
    }

    public Connection prepared(String listingUrl) {
        Connection c = Jsoup.connect(listingUrl);
        return c.header("Accept-Language", "en");
    }

    public Document legacy(String address) throws IOException {
        return Jsoup.parse(new URL(address), 5000);
    }

    public Document fromConfig(Config config) throws IOException {
        return Jsoup.connect(config.getSourceUrl()).get();
    }
}
