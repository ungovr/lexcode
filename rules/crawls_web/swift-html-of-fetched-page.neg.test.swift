// lexcode-expect: 0
import Foundation
import SwiftSoup

/// HTML the app holds itself, a documented JSON API called once, and the app's own
/// development server. None of these is scraping another site.
final class LocalContent {
    // A help page shipped in the bundle, parsed with SwiftSoup: nothing is downloaded.
    func help() throws -> String {
        let path = Bundle.main.path(forResource: "help", ofType: "html")!
        let html = try String(contentsOfFile: path, encoding: .utf8)
        return try SwiftSoup.parse(html).text()
    }

    // A bundled page read by its file URL: the address is named for the file.
    func about() throws -> String {
        let fileURL = Bundle.main.url(forResource: "about", withExtension: "html")!
        let html = try String(contentsOf: fileURL, encoding: .utf8)
        return try SwiftSoup.parse(html).text()
    }

    // HTML the user typed, cleaned before it is shown: no page is downloaded.
    func sanitize(_ input: String) throws -> String? {
        try SwiftSoup.clean(input, Whitelist.basic())
    }

    // One documented JSON API, decoded as JSON and not parsed as HTML.
    func countries() async throws -> [Country] {
        let url = URL(string: "https://restcountries.com/v2/all")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode([Country].self, from: data)
    }

    // One documented JSON endpoint whose model holds an HTML string, turned into plain text in the
    // same function: a call to a partner's documented API, not a page scrape.
    func releaseNotes() async throws -> String {
        let url = URL(string: "https://api.github.com/repos/apple/swift/releases/latest")!
        let (data, _) = try await URLSession.shared.data(from: url)
        let release = try JSONDecoder().decode(Release.self, from: data)
        return try SwiftSoup.parse(release.html).text()
    }

    func releaseNotes(from url: URL) async throws -> String {
        let (data, _) = try await URLSession.shared.data(from: url)
        let release = try JSONDecoder().decode(Release.self, from: data)
        return try SwiftSoup.parse(release.html).text()
    }

    // The app's own development server on the loopback host.
    func preview() async throws -> String {
        let (data, _) = try await URLSession.shared.data(from: URL(string: "http://localhost:8080/preview")!)
        return try SwiftSoup.parse(String(decoding: data, as: UTF8.self)).text()
    }
}

struct Country: Decodable {
    let name: String
}

struct Release: Decodable {
    let html: String
}
