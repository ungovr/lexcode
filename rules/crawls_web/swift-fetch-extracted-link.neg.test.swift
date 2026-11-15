// lexcode-expect: 0
import Foundation
import SwiftSoup

/// Links read from a page and shown to the user, not fetched; a link joined onto the app's own
/// development server; and a link the app builds itself.
final class LinkList {
    func links(html: String) throws -> [String] {
        try SwiftSoup.parse(html).select("a").array().map { try $0.attr("href") }
    }

    func show(doc: Document) throws -> String {
        let href = try doc.select("a").first()!.attr("href")
        return "Read more at \(href)"
    }

    func preview(doc: Document) async throws {
        let href = try doc.select("a").first()!.attr("href")
        _ = try await URLSession.shared.data(from: URL(string: "http://localhost:8080" + href)!)
    }

    func help() async throws {
        let title = "getting-started"
        guard let url = URL(string: "https://help.example.com/\(title)") else { return }
        _ = try await URLSession.shared.data(from: url)
    }
}
