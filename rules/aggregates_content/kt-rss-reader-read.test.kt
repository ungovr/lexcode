// lexcode-expect: 8
package example.feeds

import com.apptasticsoftware.rssreader.RssReader
import com.prof18.rssparser.RssParser
import com.prof18.rssparser.RssParserBuilder
import java.io.BufferedReader
import java.io.InputStream

class FeedDigest(
    private val rssReader: RssReader,
    private val parser: RssParser,
) {
    // rssreader
    fun literal(): List<Any> = RssReader().read("https://example.com/feed.xml").toList()

    fun variable(url: String): List<Any> = RssReader().read(url).toList()

    fun viaField(url: String): List<Any> = rssReader.read(url).toList()

    fun viaParameter(feedReader: RssReader, url: String): List<Any> = feedReader.read(url).toList()

    // prof18 RSS-Parser
    suspend fun builder(url: String) = RssParserBuilder().build().getRssChannel(url)

    suspend fun channel(url: String) = parser.getRssChannel(url)

    suspend fun direct(url: String) = RssParser().getRssChannel(url)

    suspend fun literalChannel() = parser.getRssChannel("https://example.com/feed.xml")

    // Not read: an in-memory stream, a plain line reader, and the project's own server.
    fun memory(input: InputStream): List<Any> = RssReader().read(input).toList()

    fun lines(reader: BufferedReader, stream: InputStream): Int = reader.read() + stream.read(ByteArray(8))

    fun ownServer(): List<Any> = RssReader().read("http://localhost:8080/feed.xml").toList()

    suspend fun ownChannel() = parser.getRssChannel("http://127.0.0.1:8080/feed.xml")

    suspend fun parseText(xml: String) = parser.parse(xml)
}
