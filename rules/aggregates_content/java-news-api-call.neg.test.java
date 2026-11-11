// lexcode-expect: 0
package example.newsroom;

import java.util.ArrayList;
import java.util.List;

// The application's own newsroom: its own headlines, its own API, and a project class whose methods
// share the names a news-API client uses.
public class OwnNewsroom {
    // Documentation for the integration team: see the vendor's reference at https://newsapi.org/docs
    // (a comment, not a call), and https://content.guardianapis.com/ for the licence terms.
    private static final String OWN_API = "https://api.example.org/v1/news";
    private static final String STATUS_PAGE = "https://status.example.org/";
    private static final String ABOUT = "https://www.example.org/about/newsroom";
    private static final String WEATHER = "https://api.open-meteo.com/v1/forecast";

    private final List<String> headlines = new ArrayList<>();

    public List<String> getTopHeadlines(int limit) {
        return headlines.subList(0, Math.min(limit, headlines.size()));
    }

    public List<String> getEverything() {
        return new ArrayList<>(headlines);
    }

    public int count() {
        return getTopHeadlines(5).size() + getEverything().size();
    }

    public String api() {
        return OWN_API + "?limit=10";
    }
}

class Digest {
    private final OwnNewsroom newsroom = new OwnNewsroom();

    List<String> today() {
        return newsroom.getTopHeadlines(10);
    }

    List<String> archive() {
        return newsroom.getEverything();
    }
}
