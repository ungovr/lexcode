// lexcode-expect: 1
// A main.swift script that streams another publisher's feed with URLSession's `bytes(from:)`.
import FeedKit
import Foundation

let (stream, _) = try await URLSession.shared.bytes(from: URL(string: "https://news.example.com/rss.xml")!)
var body = Data()
for try await byte in stream { body.append(byte) }
let feed = try FeedKit.RSSFeed(data: body)
print(feed.channel?.title ?? "")
