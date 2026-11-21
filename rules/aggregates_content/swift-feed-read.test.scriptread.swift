// lexcode-expect: 1
// A main.swift script whose only download is `Data(contentsOf:)` given another publisher's feed.
import FeedKit
import Foundation

let atomData = try Data(contentsOf: URL(string: "https://blog.example.org/atom.xml")!)
let atom = try FeedKit.AtomFeed(data: atomData)
print(atom.title ?? "")
