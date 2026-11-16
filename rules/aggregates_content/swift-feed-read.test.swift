// lexcode-expect: 8
import Foundation
import FeedKit

/// A news-aggregation app that reads other publishers' feeds with FeedKit.
final class NewsReader {
    func legacy(feedURL: URL) {
        let parser = FeedParser(URL: feedURL)
        parser.parseAsync { result in
            print(result)
        }
    }

    func qualified() {
        let parser = FeedKit.FeedParser(URL: URL(string: "https://www.example-news.com/rss.xml")!)
        print(parser.parse())
    }

    func modern() async throws {
        let feed = try await Feed(urlString: "https://blog.example.org/atom.xml")
        print(feed)
    }

    func typed(url: URL) async throws {
        let rss = try await RSSFeed(url: url)
        print(rss)
    }

    func fromData(url: URL) async throws {
        let (data, _) = try await URLSession.shared.data(from: url)
        let parser = FeedParser(data: data)
        print(parser.parse())
    }

    func modernData(url: URL) async throws {
        let (data, _) = try await URLSession.shared.data(from: url)
        let feed = try FeedKit.Feed(data: data)
        print(feed)
    }

    // A podcast directory's JSON names the show's feed, and the feed is then read in the same
    // function: a JSON decode beside a feed parser is still reading the feed.
    func show(directory: URL) async throws {
        let (listing, _) = try await URLSession.shared.data(from: directory)
        let entry = try JSONDecoder().decode(DirectoryEntry.self, from: listing)
        let (data, _) = try await URLSession.shared.data(from: entry.feedURL)
        let feed = try FeedKit.Feed(data: data)
        print(feed)
    }

    func split(url: URL) async throws {
        let feed = try await AtomFeed(
            url: url
        )
        print(feed)
    }
}

struct DirectoryEntry: Decodable {
    let feedURL: URL
}
