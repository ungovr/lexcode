// lexcode-expect: 4
import Foundation
import Kanna

/// A research crawler that reads other sites' articles with Kanna.
final class ArticleHarvester {
    // Kanna downloads the page itself when given an address.
    func title(of url: URL) throws -> String? {
        try Kanna.HTML(url: url, encoding: .utf8).title
    }

    func byline(of url: URL) throws -> String? {
        let doc = try HTML(url: url, encoding: .utf8)
        return doc.at_css("span.byline")?.text
    }

    func paragraphs(url: URL) async throws -> [String] {
        let (data, _) = try await URLSession.shared.data(from: url)
        let doc = try HTML(html: data, encoding: .utf8)
        return doc.css("article p").compactMap { $0.text }
    }

    func summary(url: URL) async throws -> String? {
        let (data, _) = try await URLSession.shared.data(from: url)
        guard let html = String(data: data, encoding: .utf8) else { return nil }
        let doc = try Kanna.HTML(html: html, encoding: .utf8)
        return doc.at_css("meta[name=description]")?["content"]
    }
}
