// lexcode-expect: 0
import Foundation

/// Calls to the app's own API, one documented API call, files on the device and webhook
/// deliveries. None of these downloads a list of other sites' pages.
final class Sync {
    let base = URL(string: "https://api.example.com/v1")!

    // Ids on the app's own base: the loop variable is not the address.
    func items(ids: [Int]) async throws {
        for id in ids {
            _ = try await URLSession.shared.data(from: base.appendingPathComponent("items/\(id)"))
        }
        for id in ids {
            _ = try await URLSession.shared.data(from: URL(string: "https://api.example.com/v1/items/\(id)")!)
        }
    }

    // One call to a documented API, no loop.
    func countries() async throws -> Data {
        try await URLSession.shared.data(from: URL(string: "https://restcountries.com/v2/all")!).0
    }

    // Files on the device, read in a loop.
    func load(fileURLs: [URL]) throws -> [Data] {
        try fileURLs.map { try Data(contentsOf: $0) }
    }

    func loadAll(urls: [URL]) throws {
        for url in urls {
            _ = try String(contentsOf: url)
        }
    }

    // Cached copies listed from the caches directory.
    func reload(cachedURLs: [URL]) async throws {
        for url in cachedURLs {
            _ = try await URLSession.shared.data(from: url)
        }
    }

    // Webhook deliveries: a POST to each subscriber's address.
    func deliver(endpoints: [URL], payload: Data) async throws {
        for endpoint in endpoints {
            var request = URLRequest(url: endpoint)
            request.httpMethod = "POST"
            request.httpBody = payload
            _ = try await URLSession.shared.data(for: request)
        }
    }
}
