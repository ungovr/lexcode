// lexcode-expect: 5
import Foundation
import SwiftSoup

/// A crawler that follows the links on each page it reads.
final class LinkFollower {
    func follow(doc: Document) async throws {
        for anchor in try doc.select("a[href]") {
            let href = try anchor.attr("href")
            guard let next = URL(string: href) else { continue }
            let (data, _) = try await URLSession.shared.data(from: next)
            print(data.count)
        }
    }

    func nextPage(doc: Document) async throws -> Data? {
        let link = try doc.select("a.next").first()?.absUrl("href") ?? ""
        return try await URLSession.shared.data(from: URL(string: link)!).0
    }

    func frontier(doc: Document) async throws {
        var queue: [String] = []
        for anchor in try doc.select("a[href]") {
            queue.append(try anchor.attr("abs:href"))
        }
        for address in queue {
            let request = Foundation.URLRequest(url: URL(string: address)!)
            _ = try await URLSession.shared.data(for: request)
        }
    }

    func images(doc: Document) throws -> [Data] {
        var out: [Data] = []
        for img in try doc.select("img") {
            let src = try img.attr("src")
            if let url = URL(string: src) {
                out.append(try Data(contentsOf: url))
            }
        }
        return out
    }

    func split(doc: Document) async throws {
        let href = try doc.select("link[rel=next]").first()!.attr("href")
        _ = try await URLSession.shared
            .data(
                from: URL(string: href)!
            )
    }
}
