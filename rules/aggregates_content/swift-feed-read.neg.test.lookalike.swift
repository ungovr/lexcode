// lexcode-expect: 0
import Foundation

/// The app's own home feed, built from its own backend, with types named like FeedKit's. This
/// file does not import FeedKit or SyndiKit.
struct Feed: Decodable {
    let cards: [String]

    init(url: URL) async throws {
        let (data, _) = try await URLSession.shared.data(from: url)
        self = try JSONDecoder().decode(Feed.self, from: data)
    }

    init(data: Data) throws {
        self = try JSONDecoder().decode(Feed.self, from: data)
    }
}

final class FeedParser {
    init(URL: URL) {
        print(URL)
    }
}

final class HomeFeedLoader {
    func load(url: URL) async throws -> Feed {
        let (data, _) = try await URLSession.shared.data(from: url)
        _ = FeedParser(URL: url)
        return try Feed(data: data)
    }

    func refresh(feedURL: URL) async throws -> Feed {
        try await Feed(url: feedURL)
    }
}
