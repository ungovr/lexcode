// lexcode-expect: 0
package example.newsroom

import retrofit2.Retrofit
import retrofit2.http.GET
import retrofit2.http.Query

// The project's own newsroom API, and unrelated API hosts.
interface OwnNewsApi {
    @GET("https://newsroom.example.com/api/articles")
    suspend fun articles(@Query("page") page: Int): List<String>

    @GET("https://api.github.com/repos/jetbrains/kotlin/releases")
    suspend fun releases(): List<String>
}

// A comment or a label that names a vendor is not a call to it: see https://newsapi.org/docs for
// what we chose not to use.
const val LABEL = "newsapi.org"

val retrofit: Retrofit = Retrofit.Builder().baseUrl("https://newsroom.example.com/").build()

// A project class that shares the method names of a news API client, in a file that imports none.
class Headlines {
    fun getTopHeadlines(country: String): List<String> = listOf(country)

    fun getEverything(query: String): List<String> = listOf(query)
}

class Front(private val newsApi: Headlines, private val client: Headlines) {
    fun top() = newsApi.getTopHeadlines("us")

    fun all() = client.getEverything("kotlin")
}
