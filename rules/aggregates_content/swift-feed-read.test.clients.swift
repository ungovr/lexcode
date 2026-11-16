// lexcode-expect: 2
import Foundation
import FeedKit
import AsyncHTTPClient
import Alamofire

/// A digest server and an app that download other publishers' feeds with AsyncHTTPClient and
/// Alamofire, then read them with FeedKit.
final class FeedFetcher {
    func server(client: HTTPClient, source: String) async throws -> Feed {
        let request = HTTPClientRequest(url: source)
        let response = try await client.execute(request, timeout: .seconds(20))
        let body = try await response.body.collect(upTo: 1 << 22)
        return try Feed(data: Data(buffer: body))
    }

    func app(url: URL) async throws -> Feed {
        let data = try await AF.request(url).serializingData().value
        return try FeedKit.Feed(data: data)
    }
}
