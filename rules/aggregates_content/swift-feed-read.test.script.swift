// lexcode-expect: 2
// A main.swift script that downloads another publisher's feed and parses it at the top level.
import FeedKit
import Foundation

let feedURL = URL(string: "https://news.example.com/rss.xml")!
let (data, _) = try await URLSession.shared.data(from: feedURL)
let feed = try FeedKit.RSSFeed(data: data)
print(feed.channel?.title ?? "")

let atomData = try Data(contentsOf: URL(string: "https://blog.example.org/atom.xml")!)
let atom = try FeedKit.AtomFeed(data: atomData)
print(atom.title ?? "")
