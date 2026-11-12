// lexcode-expect: 7
package example.links;

import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.jsoup.nodes.Element;
import org.springframework.web.client.RestTemplate;

// Following the links found on a page: the next fetch takes its address from the page just read.
public class LinkFollower {
    private final HttpClient http = HttpClient.newHttpClient();
    private final RestTemplate restTemplate = new RestTemplate();
    private final OkHttpClient okHttpClient = new OkHttpClient();

    public void jdkClient(Element a) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(a.absUrl("href"))).build();
        http.send(req, HttpResponse.BodyHandlers.ofString());
    }

    public void jdkClientAttr(Element a) throws Exception {
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(a.attr("abs:href"))).build();
        http.send(req, HttpResponse.BodyHandlers.ofString());
    }

    public InputStream plainUrl(Element link) throws Exception {
        return new URL(link.absUrl("href")).openStream();
    }

    public String rest(Element link) {
        return restTemplate.getForObject(link.attr("href"), String.class);
    }

    public void okhttp(Element img) throws Exception {
        Request request = new Request.Builder().url(img.absUrl("src")).build();
        okHttpClient.newCall(request).execute().close();
    }

    public void apache(Element a) {
        HttpGet get = new HttpGet(a.absUrl("href"));
    }

    public void seleniumElement(org.openqa.selenium.WebElement anchor) throws Exception {
        new URL(anchor.getAttribute("href")).openConnection();
    }
}
