// lexcode-expect: 7
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

    func split(url: URL) async throws {
        let feed = try await AtomFeed(
            url: url
        )
        print(feed)
    }
}
