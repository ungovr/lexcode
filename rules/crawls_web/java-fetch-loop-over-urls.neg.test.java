// lexcode-expect: 0
package example.sync;

import java.io.IOException;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.springframework.web.client.RestTemplate;

public class OwnApiClient {
    private static final String BASE = "http://localhost:8080";
    private final HttpClient http = HttpClient.newHttpClient();
    private final RestTemplate rest = new RestTemplate();
    private final OkHttpClient ok = new OkHttpClient();

    // The project's own API: the loop variable is an id, and the URL is built from a base.
    public void pullItems(List<String> itemIds) throws Exception {
        for (String id : itemIds) {
            HttpRequest req = HttpRequest.newBuilder(URI.create(BASE + "/api/items/" + id)).build();
            http.send(req, HttpResponse.BodyHandlers.ofString());
        }
    }

    public void pullWithRest(List<Long> ids) {
        ids.forEach(id -> rest.getForObject(BASE + "/api/items/{id}", String.class, id));
    }

    public void pullWithOkHttp(List<String> ids) throws IOException {
        for (String id : ids) {
            Request request = new Request.Builder().url("http://127.0.0.1:8080/api/items/" + id).build();
            ok.newCall(request).execute().close();
        }
    }

    // One documented partner API call, not in a loop.
    public String repoInfo() throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.github.com/repos/spring-projects/spring-boot")).build();
        return http.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }

    // The loop variable is looked up or printed, never fetched.
    public void lookups(List<String> urls, Map<String, String> cache) {
        for (String url : urls) {
            String hit = cache.get(url);
            System.out.println(url + " -> " + hit);
        }
    }

    public void hosts(List<String> urls) throws Exception {
        urls.forEach(u -> System.out.println(URI.create(u).getHost()));
    }

    // Local files opened with a loop variable.
    public long sizes(List<String> paths) throws IOException {
        long total = 0;
        for (String path : paths) {
            total += new java.io.File(path).length();
            total += new URL("file:" + path).openConnection().getContentLengthLong();
        }
        return total;
    }
}
