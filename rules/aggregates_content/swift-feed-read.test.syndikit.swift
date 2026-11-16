// lexcode-expect: 2
import Foundation
import SyndiKit

/// A podcast app that reads each show's feed with SyndiKit.
final class PodcastDirectory {
    func episodes(feedURL: URL) async throws -> [String] {
        let (data, _) = try await URLSession.shared.data(from: feedURL)
        let feed = try SynDecoder().decode(data)
        return feed.children.map(\.title)
    }

    func legacy(url: URL, decoder: SynDecoder) {
        URLSession.shared.dataTask(with: url) { data, _, _ in
            guard let data = data else { return }
            let feed = try? decoder.decode(data)
            print(feed as Any)
        }.resume()
    }
}
