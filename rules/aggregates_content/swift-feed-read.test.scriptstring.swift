// lexcode-expect: 1
// A main.swift script whose only download is `String(contentsOf:)` given another publisher's feed.
import FeedKit
import Foundation

let text = try String(contentsOf: URL(string: "https://news.example.com/rss.xml")!)
let feed = try FeedKit.RSSFeed(data: Data(text.utf8))
print(feed.channel?.title ?? "")
