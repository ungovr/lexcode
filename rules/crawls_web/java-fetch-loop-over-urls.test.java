// lexcode-expect: 12
package example.pricewatch;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

// A job that walks a list of pages held in a variable and downloads each one.
public class RefreshListingsJob {
    private final HttpClient http = HttpClient.newHttpClient();
    private final RestTemplate restTemplate = new RestTemplate();
    private final OkHttpClient okHttpClient = new OkHttpClient();
    private final WebClient webClient = WebClient.create();
    private final CloseableHttpClient httpClient = null;

    public void withJdkClient(List<String> urls) throws Exception {
        for (String url : urls) {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url)).build();
            http.send(request, HttpResponse.BodyHandlers.ofString());
        }
    }

    public void withJdkBuilder(List<String> pageUrls) throws Exception {
        for (String pageUrl : pageUrls) {
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(pageUrl)).GET().build();
            http.send(request, HttpResponse.BodyHandlers.ofString());
        }
    }

    public void withStream(List<String> urls) {
        urls.stream().map(u -> HttpRequest.newBuilder(URI.create(u)).build()).forEach(r -> {});
    }

    public void withUrlStream(List<String> links) throws IOException {
        for (String link : links) {
            try (InputStream in = new URL(link).openStream()) {
                in.readAllBytes();
            }
        }
    }

    public void withUrlConnection(List<String> links) throws IOException {
        for (String link : links) {
            HttpURLConnection conn = (HttpURLConnection) new URL(link).openConnection();
            conn.getInputStream().close();
        }
    }

    public void withRestTemplate(List<String> urls) {
        for (String url : urls) {
            String body = restTemplate.getForObject(url, String.class);
            System.out.println(body.length());
        }
    }

    public void withRestEntity(List<String> urls) {
        urls.forEach(u -> restTemplate.getForEntity(u, String.class));
    }

    public void withOkHttp(List<String> urls) throws IOException {
        for (String url : urls) {
            Request request = new Request.Builder().url(url).build();
            okHttpClient.newCall(request).execute().close();
        }
    }

    public void withWebClient(List<String> urls) {
        for (String url : urls) {
            webClient.get().uri(url).retrieve().bodyToMono(String.class).block();
        }
    }

    public void withApacheClient(List<String> urls) throws Exception {
        for (String url : urls) {
            httpClient.execute(new HttpGet(url), r -> r.getCode());
        }
    }

    public void withLambdaParam(List<String> urls) {
        urls.forEach((String url) -> restTemplate.getForObject(url, String.class));
    }

    public void parallel(List<String> urls) {
        urls.parallelStream().forEach(url -> restTemplate.headForHeaders(url));
    }
}
