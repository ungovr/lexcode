// lexcode-expect: 3
import Foundation
import Vapor

/// Headlines from other publishers' RSS feeds, parsed with Foundation's XMLParser.
final class HeadlineParser: NSObject, XMLParserDelegate {
    private var titles: [String] = []
    private var element = ""

    func load(rssURL: URL) -> [String] {
        let parser = XMLParser(contentsOf: rssURL)!
        parser.delegate = self
        parser.parse()
        return titles
    }

    func fetch(from url: URL) async throws -> [String] {
        let (data, _) = try await URLSession.shared.data(from: url)
        let parser = Foundation.XMLParser(data: data)
        parser.delegate = self
        parser.parse()
        return titles
    }

    func server(req: Request, source: String) async throws -> [String] {
        let response = try await req.client.get(URI(string: source))
        let parser = XMLParser(data: Data(buffer: response.body ?? ByteBuffer()))
        parser.delegate = self
        parser.parse()
        return titles
    }

    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String: String] = [:]) {
        element = elementName
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) {
        if element == "title" {
            titles.append(string)
        }
        if element == "pubDate" {
            print(string)
        }
    }
}
