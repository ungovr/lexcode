// lexcode-expect: 2
import Foundation
import Fuzi

/// A search-indexing bot that reads each page's HTML with Fuzi.
final class Indexer {
    func index(url: URL) async throws -> String? {
        let (data, _) = try await URLSession.shared.data(from: url)
        let doc = try HTMLDocument(data: data)
        return doc.title
    }

    func indexText(url: URL) async throws -> String? {
        let (data, _) = try await URLSession.shared.data(from: url)
        let doc = try Fuzi.HTMLDocument(string: String(decoding: data, as: UTF8.self))
        return doc.body?.stringValue
    }
}
