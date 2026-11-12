// lexcode-expect: 0
package example.pages;

import java.io.File;
import java.io.IOException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

public class HtmlTools {

    // Cleaning and parsing markup the application already holds fetches nothing.
    public String sanitize(String userHtml) {
        return Jsoup.clean(userHtml, Safelist.basic());
    }

    public Document fromString(String html) {
        return Jsoup.parse(html);
    }

    public Document fromDisk(File template) throws IOException {
        return Jsoup.parse(template, "UTF-8");
    }

    public String firstHeading(String html) {
        return Jsoup.parse(html).select("h1").text();
    }

    // A smoke test of the project's own pages on loopback.
    public Document ownHome() throws IOException {
        return Jsoup.connect("http://localhost:8080/").get();
    }

    public int ownHealth() throws IOException {
        return Jsoup.connect("http://127.0.0.1:8080/health").ignoreContentType(true).execute().statusCode();
    }

    public Document ownIpv6() throws IOException {
        return Jsoup.connect("http://[::1]:8080/admin").get();
    }
}

class Importer {
    // The project's own method that happens to share the library's verb.
    Object connect(String dsn) {
        return dsn.trim();
    }

    Object open() {
        return connect("jdbc:postgresql://db/app");
    }
}
