// lexcode-expect: 9
import Foundation
import AsyncHTTPClient
import Vapor
import Alamofire

/// A research crawler that downloads every address in a list.
final class Harvester {
    func harvest(urls: [URL]) async throws -> [Data] {
        var pages: [Data] = []
        for url in urls {
            let (data, _) = try await URLSession.shared.data(from: url)
            pages.append(data)
        }
        return pages
    }

    func harvestStrings(addresses: [String]) {
        addresses.forEach { address in
            URLSession.shared.dataTask(with: URL(string: address)!).resume()
        }
    }

    func harvestImplicit(addresses: [String]) -> [URLSessionDataTask] {
        addresses.map { URLSession.shared.dataTask(with: URL(string: $0)!) }
    }

    func harvestEnumerated(urls: [URL]) async throws {
        for (index, url) in urls.enumerated() {
            print(index)
            var request = URLRequest(url: url)
            request.setValue("research-bot/1.0", forHTTPHeaderField: "User-Agent")
            _ = try await URLSession.shared.data(for: request)
        }
    }

    func harvestGroup(urls: [URL]) async throws {
        try await withThrowingTaskGroup(of: Data.self) { group in
            for url in urls {
                group.addTask {
                    try await Foundation.URLSession.shared.data(from: url).0
                }
            }
        }
    }

    func harvestServer(client: HTTPClient, urls: [String]) async throws {
        for url in urls {
            let request = HTTPClientRequest(url: url)
            _ = try await client.execute(request, timeout: .seconds(10))
        }
    }

    func harvestAlamofire(urls: [URL]) async throws {
        for url in urls {
            _ = try await AF.request(url).serializingData().value
        }
    }

    func harvestVapor(req: Request, urls: [String]) async throws {
        for url in urls {
            _ = try await req.client.get(URI(string: url))
        }
    }

    func harvestSplit(urls: [URL]) async throws {
        for url in urls {
            _ = try await URLSession.shared
                .data(
                    from: url
                )
        }
    }
}
