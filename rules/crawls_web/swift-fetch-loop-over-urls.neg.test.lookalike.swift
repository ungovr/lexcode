// lexcode-expect: 0
import Foundation

/// The app's own types named like Alamofire's `AF`, AsyncHTTPClient's `HTTPClientRequest` and
/// Kanna's `HTML(url:)`, used in loops. This file imports none of those libraries, and none of
/// these calls downloads anything.
enum AF {
    static func request(_ name: String) -> String {
        "queued \(name)"
    }
}

struct HTTPClientRequest {
    let url: String
}

func HTML(url: URL, encoding: String.Encoding) -> String {
    url.lastPathComponent
}

final class Ledger {
    func record(names: [String]) -> [HTTPClientRequest] {
        var out: [HTTPClientRequest] = []
        for name in names {
            print(AF.request(name))
            out.append(HTTPClientRequest(url: name))
        }
        return out
    }

    func titles(urls: [URL]) -> [String] {
        urls.map { HTML(url: $0, encoding: .utf8) }
    }
}
