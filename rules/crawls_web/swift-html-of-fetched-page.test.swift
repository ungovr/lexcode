// lexcode-expect: 8
import Foundation
import SwiftSoup
import AsyncHTTPClient
import Vapor
import Alamofire

/// A price-comparison scraper: each method downloads another site's page and reads its HTML.
final class PriceScraper {
    func listings(from url: URL) async throws -> [String] {
        let (data, _) = try await URLSession.shared.data(from: url)
        guard let html = String(data: data, encoding: .utf8) else { return [] }
        let doc = try SwiftSoup.parse(html)
        return try doc.select("li.price").array().map { try $0.text() }
    }

    func headlines(url: URL, done: @escaping ([String]) -> Void) {
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { return }
            let doc = try? SwiftSoup.parse(String(decoding: data, as: UTF8.self))
            done((try? doc?.select("h2").array().map { try $0.text() }) ?? [])
        }.resume()
    }

    func catalog() throws -> String {
        let page = try String(contentsOf: URL(string: "https://shop.example.com/catalog")!, encoding: .utf8)
        return try parse(page).title()
    }

    func request(url: URL) async throws -> Document {
        let (data, _) = try await URLSession.shared.data(for: URLRequest(url: url))
        if let html = String(data: data, encoding: .utf8) {
            return try SwiftSoup.parse(html, url.absoluteString)
        }
        throw URLError(.cannotDecodeContentData)
    }

    func frontPage(client: HTTPClient) async throws -> Document {
        let request = HTTPClientRequest(url: "https://news.example.org/front")
        let response = try await client.execute(request, timeout: .seconds(30))
        let body = try await response.body.collect(upTo: 1 << 24)
        return try SwiftSoup.parse(String(buffer: body))
    }

    func listing(req: Request) async throws -> String {
        let res = try await req.client.get("https://prices.example.com/item/1")
        guard let body = res.body else { throw Abort(.badGateway) }
        let doc = try SwiftSoup.parse(String(buffer: body))
        return try doc.title()
    }

    func viaAlamofire(url: URL) async throws -> Document {
        let html = try await AF.request(url).serializingString().value
        return try SwiftSoup.parse(html)
    }

    func multiline(url: URL) async throws -> Document {
        let (data, _) = try await URLSession.shared
            .data(from: url)
        return try SwiftSoup
            .parse(
                String(decoding: data, as: UTF8.self)
            )
    }
}
