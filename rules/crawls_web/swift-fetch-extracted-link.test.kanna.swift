// lexcode-expect: 4
import Foundation
import Kanna
import AsyncHTTPClient
import Vapor
import Alamofire

/// A price-comparison crawler that reads product links with Kanna and follows them.
final class ProductCrawler {
    func products(doc: HTMLDocument) async throws {
        for a in doc.css("a.product") {
            let href = a["href"] ?? ""
            _ = try await URLSession.shared.data(from: URL(string: href)!)
        }
    }

    func server(doc: HTMLDocument, client: HTTPClient) async throws {
        let href = doc.at_css("a.next")?["href"] ?? ""
        _ = try await client.execute(HTTPClientRequest(url: href), timeout: .seconds(10))
    }

    func vapor(doc: HTMLDocument, req: Request) async throws {
        let href = doc.at_css("a.next")?["href"] ?? ""
        _ = try await req.client.get(URI(string: href))
    }

    func alamofire(doc: HTMLDocument) async throws {
        let href = doc.at_css("a.next")?["href"] ?? ""
        _ = try await AF.request(href).serializingString().value
    }
}
