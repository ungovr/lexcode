// lexcode-expect: 0
// A main.swift script that parses a feed the app ships with, read from a file on the device.
import FeedKit
import Foundation

let shipped = try Data(contentsOf: URL(fileURLWithPath: "/usr/share/app/feed.xml"))
let feed = try FeedKit.RSSFeed(data: shipped)
print(feed.channel?.title ?? "")
