// lexcode-expect: 0
import Foundation

/// An API's own pagination links in its JSON body, followed with no HTML parser in the file.
/// The `["href"]` here is a dictionary's, not an HTML element's.
final class Pager {
    func pages(start: URL) async throws -> [Data] {
        var out: [Data] = []
        var next: String? = start.absoluteString
        while let address = next {
            let (data, _) = try await URLSession.shared.data(from: URL(string: address)!)
            out.append(data)
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let links = json?["_links"] as? [String: [String: String]]
            next = links?["next"]?["href"]
        }
        return out
    }

    func element(_ node: [String: String]) async throws -> Data {
        let href = node["href"] ?? ""
        return try await URLSession.shared.data(from: URL(string: href)!).0
    }
}
