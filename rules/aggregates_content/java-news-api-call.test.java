// lexcode-expect: 9
package example.newsroom;

import com.kwabenaberko.newsapilib.NewsApiClient;
import com.kwabenaberko.newsapilib.models.request.EverythingRequest;
import com.kwabenaberko.newsapilib.models.request.TopHeadlinesRequest;
import com.kwabenaberko.newsapilib.models.response.ArticleResponse;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

// A news app that fills its front page with headlines and snippets from third-party news APIs.
public class FrontPage {
    private static final String NEWSAPI = "https://newsapi.org/v2/top-headlines?country=us";
    private static final String GUARDIAN = "https://content.guardianapis.com/search?section=world";
    private static final String NYT = "https://api.nytimes.com/svc/topstories/v2/home.json";
    private static final String GNEWS = "https://gnews.io/api/v4/search?q=election";
    private static final String NEWSDATA = "https://newsdata.io/api/1/news?language=en";

    private final NewsApiClient client = new NewsApiClient("key");

    public void viaClient() {
        client.getTopHeadlines(new TopHeadlinesRequest.Builder().q("bitcoin").language("en").build(), null);
        client.getEverything(new EverythingRequest.Builder().q("climate").build(), null);
    }

    static retrofit2.Retrofit retrofit() {
        return new retrofit2.Retrofit.Builder().baseUrl("https://newsapi.org/").build();
    }

    interface NewsService {
        @GET("https://newsapi.org/v2/everything")
        Call<ArticleResponse> everything(@Query("q") String q);
    }
}
