// lexcode-expect: 0
import Foundation

/// The app's own HTML helpers, which share their names with Kanna's `HTML(html:)` and Fuzi's
/// `HTMLDocument`. This file imports neither library, so these are not HTML parsers.
struct HTMLDocument {
    let string: String

    init(string: String) {
        self.string = string
    }

    init(data: Data) {
        self.string = String(decoding: data, as: UTF8.self)
    }
}

func HTML(html: String, encoding: String.Encoding) -> HTMLDocument {
    HTMLDocument(string: html)
}

final class MessageRenderer {
    func render(url: URL) async throws -> HTMLDocument {
        let (data, _) = try await URLSession.shared.data(from: url)
        return HTMLDocument(data: data)
    }

    func wrap(url: URL) async throws -> HTMLDocument {
        let (data, _) = try await URLSession.shared.data(from: url)
        return HTML(html: String(decoding: data, as: UTF8.self), encoding: .utf8)
    }
}
