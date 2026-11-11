// lexcode-expect: 0
package example.feeds

import java.io.BufferedReader
import java.io.InputStream

// Project classes whose method names match two feed libraries', in a file that imports neither
// library: the receiver names and the calls line up with the patterns the rule reads in a file
// that does import one.
class RssReader {
    fun read(source: String): List<String> = listOf(source)
}

class RssParser {
    suspend fun getRssChannel(url: String): String = url

    suspend fun getChannel(url: String): String = url
}

class Digest(private val rssReader: RssReader, private val parser: RssParser, private val feedParser: RssParser) {
    fun fromLiteral(): List<String> = RssReader().read("https://example.com/feed.xml")

    fun fromVariable(url: String): List<String> = RssReader().read(url)

    fun viaField(url: String): List<String> = rssReader.read(url)

    suspend fun parserCalls(url: String): List<String> =
        listOf(RssParser().getRssChannel(url), parser.getRssChannel(url), feedParser.getChannel(url))

    // A plain reader of lines, not a feed reader.
    fun lines(reader: BufferedReader, stream: InputStream): Int = reader.read() + stream.read(ByteArray(8))
}
