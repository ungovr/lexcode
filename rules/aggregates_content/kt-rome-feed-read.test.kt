// lexcode-expect: 12
package example.feeds

import com.rometools.fetcher.impl.HttpURLFeedFetcher
import com.rometools.rome.feed.synd.SyndFeed
import com.rometools.rome.feed.synd.SyndFeedImpl
import com.rometools.rome.io.SyndFeedInput
import com.rometools.rome.io.SyndFeedOutput
import com.rometools.rome.io.XmlReader
import java.io.File
import java.io.InputStream
import java.io.InputStreamReader
import java.io.StringReader
import java.net.URI
import java.net.URL

class PublisherReader(private val fetcher: HttpURLFeedFetcher) {
    fun readUrl(url: String): SyndFeed = SyndFeedInput().build(XmlReader(URL(url)))

    fun readUri(url: String): SyndFeed {
        val input = SyndFeedInput()
        return input.build(XmlReader(URI.create(url).toURL()))
    }

    fun readStream(url: String): SyndFeed = SyndFeedInput().build(XmlReader(URL(url).openStream()))

    fun readUriStream(url: String): SyndFeed =
        SyndFeedInput().build(XmlReader(URI.create(url).toURL().openStream()))

    fun readInputStreamReader(url: String): SyndFeed =
        SyndFeedInput().build(InputStreamReader(URL(url).openStream()))

    fun readUriInputStreamReader(url: String): SyndFeed =
        SyndFeedInput().build(InputStreamReader(URI.create(url).toURL().openStream()))

    fun readWithUse(url: String): SyndFeed =
        URL(url).openStream().use { SyndFeedInput().build(XmlReader(it)) }

    fun fetchUrl(url: String): SyndFeed = fetcher.retrieveFeed(URL(url))

    fun fetchUri(url: String): SyndFeed = fetcher.retrieveFeed(URI.create(url).toURL())

    fun fetchName(url: URL): SyndFeed = fetcher.retrieveFeed(url)

    fun readConnection(conn: java.net.HttpURLConnection): SyndFeed =
        SyndFeedInput().build(XmlReader(conn.inputStream))

    fun readConnectionGetter(connection: java.net.HttpURLConnection): SyndFeed =
        SyndFeedInput().build(XmlReader(connection.getInputStream()))

    // Feeds the app holds already, or its own server's: none of these reads another publisher.
    fun fromFile(f: File): SyndFeed = SyndFeedInput().build(XmlReader(f))

    fun fromMultipart(file: org.springframework.web.multipart.MultipartFile): SyndFeed =
        SyndFeedInput().build(XmlReader(file.inputStream))

    fun fromString(xml: String): SyndFeed = SyndFeedInput().build(StringReader(xml))

    fun fromUpload(upload: InputStream): SyndFeed = SyndFeedInput().build(XmlReader(upload))

    fun fromClasspath(): SyndFeed = SyndFeedInput().build(XmlReader(javaClass.getResourceAsStream("/seed.xml")))

    fun fromFileUrl(path: String): SyndFeed = SyndFeedInput().build(XmlReader(URL("file:$path")))

    fun fromFileStream(): SyndFeed = SyndFeedInput().build(XmlReader(URL("file:/srv/feeds/seed.xml").openStream()))

    fun fromJar(): SyndFeed = SyndFeedInput().build(XmlReader(URL("jar:file:/srv/app.jar!/seed.xml")))

    fun fromLocalhost(): SyndFeed = SyndFeedInput().build(XmlReader(URL("http://localhost:8080/feed.xml")))

    fun fromLoopback(): SyndFeed = SyndFeedInput().build(XmlReader(URL("http://127.0.0.1:8080/feed.xml").openStream()))

    fun fromName(): SyndFeed = fetcher.retrieveFeed("seed.xml")

    // Writing a feed is publishing, not aggregating.
    fun publish(feed: SyndFeedImpl): String = SyndFeedOutput().outputString(feed)
}
