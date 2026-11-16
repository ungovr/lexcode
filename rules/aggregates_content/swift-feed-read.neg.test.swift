// lexcode-expect: 0
import Foundation
import FeedKit

/// A sample feed shipped in the bundle, the app's own development server, a feedback form and a
/// settings file, and XML from the app's own API that is not a feed.
final class Fixtures: NSObject, XMLParserDelegate {
    func sample() {
        let parser = FeedParser(URL: Bundle.main.url(forResource: "sample", withExtension: "rss")!)
        print(parser.parse())
    }

    func devServer() async throws {
        let feed = try await Feed(urlString: "http://127.0.0.1:4000/feed.xml")
        print(feed)
    }

    func feedback(feedbackURL: URL) {
        let parser = XMLParser(contentsOf: feedbackURL)
        parser?.delegate = self
        parser?.parse()
    }

    func settings(configURL: URL) {
        let parser = XMLParser(contentsOf: configURL)
        parser?.parse()
    }

    func inventory(url: URL) async throws {
        let (data, _) = try await URLSession.shared.data(from: url)
        let parser = XMLParser(data: data)
        parser.delegate = self
        parser.parse()
    }

    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String: String] = [:]) {
        if elementName == "sku" {
            print(attributeDict)
        }
    }
}
