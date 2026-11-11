// lexcode-expect: 0
package example.links;

import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.web.client.RestTemplate;

// Reading links out of a page the application holds is not following them.
public class LinkReport {
    private final HttpClient http = HttpClient.newHttpClient();
    private final RestTemplate restTemplate = new RestTemplate();

    public List<String> hrefs(Document page) {
        List<String> out = new ArrayList<>();
        for (Element a : page.select("a[href]")) {
            out.add(a.absUrl("href"));
            out.add(a.attr("href"));
        }
        return out;
    }

    public List<String> hosts(Document page) {
        List<String> out = new ArrayList<>();
        for (Element a : page.select("a[href]")) {
            out.add(URI.create(a.absUrl("href")).getHost());
        }
        return out;
    }

    public URL resolve(URL base, Element a) throws Exception {
        return new URL(base, a.attr("href"));
    }

    // The application's own API, with a link taken from its own response as a path.
    public String ownNext(Element nextLink) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create("http://localhost:8080" + nextLink.attr("href"))).build();
        return http.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }

    // A fetch of a URL that did not come from a page.
    public String configured(String feedUrl) throws Exception {
        return restTemplate.getForObject(feedUrl, String.class);
    }

    public String attribute(Element el) {
        return el.attr("data-id");
    }
}
