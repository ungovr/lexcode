// lexcode-expect: 0
import Foundation
import SwiftSoup

/// The app's own `AF` (article files) store and its own `HTTPClientRequest` record, named like
/// Alamofire's session and AsyncHTTPClient's request. This file imports neither library; the
/// templates it parses are on the device.
enum AF {
    static func request(_ name: String) -> String {
        (try? String(contentsOfFile: name, encoding: .utf8)) ?? ""
    }
}

struct HTTPClientRequest {
    let url: String
}

final class TemplateLoader {
    func template(named name: String) throws -> Document {
        let html = AF.request(name)
        return try SwiftSoup.parse(html)
    }

    func logged(named name: String) throws -> Document {
        let entry = HTTPClientRequest(url: name)
        print(entry)
        return try SwiftSoup.parse(AF.request(name))
    }
}
