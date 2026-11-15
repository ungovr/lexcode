// lexcode-expect: 2
import Foundation
import Fuzi

/// A search-indexing bot that follows links read with Fuzi.
final class FuziFollower {
    func follow(doc: HTMLDocument) async throws {
        for a in doc.css("a") {
            let href = a["href"] ?? ""
            _ = try await URLSession.shared.data(from: URL(string: href)!)
        }
        let canonical = doc.firstChild(css: "link[rel=canonical]")?.attr("href") ?? ""
        guard let url = URL(string: canonical) else { return }
        _ = try await URLSession.shared.data(from: url)
    }
}
