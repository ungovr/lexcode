// lexcode-expect: 14
package example.headlines

import com.kwabenaberko.newsapilib.NewsApiClient
import com.kwabenaberko.newsapilib.models.request.EverythingRequest
import com.kwabenaberko.newsapilib.models.request.TopHeadlinesRequest
import retrofit2.Retrofit
import retrofit2.http.GET
import retrofit2.http.Query

interface NewsService {
    @GET("https://newsapi.org/v2/top-headlines")
    suspend fun top(@Query("country") country: String): String

    @GET("https://newsdata.io/api/1/news")
    suspend fun newsdata(): String

    @GET("https://gnews.io/api/v4/top-headlines")
    suspend fun gnews(): String

    @GET("https://api.nytimes.com/svc/topstories/v2/home.json")
    suspend fun nyt(): String

    @GET("https://content.guardianapis.com/search")
    suspend fun guardian(): String

    @GET("http://api.mediastack.com/v1/news")
    suspend fun mediastack(): String

    @GET("https://api.thenewsapi.com/v1/news/top")
    suspend fun thenewsapi(): String
}

val retrofit: Retrofit = Retrofit.Builder().baseUrl("https://newsapi.org/").build()

fun everything(apiKey: String) = "https://newsapi.org/v2/everything?q=kotlin&apiKey=$apiKey"

val raw = """https://newsapi.ai/api/v1/article/getArticles"""

val worldNews = "https://api.worldnewsapi.com/search-news"

val bing = "https://api.bing.microsoft.com/v7.0/news/search"

// The NewsAPI Java client.
class Fetcher(private val newsApiClient: NewsApiClient) {
    fun top() {
        newsApiClient.getTopHeadlines(TopHeadlinesRequest.Builder().q("kotlin").build(), null)
    }

    fun all() {
        newsApiClient.getEverything(EverythingRequest.Builder().q("kotlin").build(), null)
    }
}
