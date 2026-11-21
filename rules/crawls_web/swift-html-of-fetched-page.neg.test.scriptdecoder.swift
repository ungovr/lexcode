// lexcode-expect: 0
// A main.swift script that decodes a JSON API with a decoder made in another file, then parses one
// HTML field of its model.
import Foundation
import SwiftSoup

struct Story: Decodable { let bodyHTML: String }

let (feed, _) = try await URLSession.shared.data(from: URL(string: "https://api.example.com/v1/feed")!)
let items = try sharedDecoder.decode([Story].self, from: feed)
print(try SwiftSoup.parse(items[0].bodyHTML).text())
