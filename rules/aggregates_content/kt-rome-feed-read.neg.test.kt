// lexcode-expect: 0
package example.feeds

import java.io.InputStreamReader
import java.net.URI
import java.net.URL

// A project's own feed-building classes, in a file that imports no feed library: the methods are
// named build and retrieveFeed, and they take a URL, but nothing here is Rome.
class XmlReader(val source: URL)

class FeedInput {
    fun build(reader: XmlReader): String = reader.source.toString()

    fun build(reader: InputStreamReader): String = reader.encoding
}

class FeedImporter {
    fun retrieveFeed(url: URL): String = url.toString()

    fun retrieveFeed(url: String): String = url
}

class Reports(private val input: FeedInput, private val importer: FeedImporter) {
    fun fromUrl(url: String): String = input.build(XmlReader(URL(url)))

    fun fromUri(url: String): String = input.build(XmlReader(URI.create(url).toURL()))

    fun fromStream(url: String): String = input.build(InputStreamReader(URL(url).openStream()))

    fun viaUse(url: String): String = URL(url).openStream().use { input.build(InputStreamReader(it)) }

    fun import(url: String): String = importer.retrieveFeed(URL(url))

    fun importUri(url: String): String = importer.retrieveFeed(URI.create(url).toURL())

    fun importName(url: String): String = importer.retrieveFeed(url)
}
