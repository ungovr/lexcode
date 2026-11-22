// lexcode-expect: 0
// A main.swift script that decodes a JSON API into a generic wrapper type with a decoder made in
// another file, then parses one HTML field of its model.
import Foundation
import SwiftSoup

struct Story: Decodable { let bodyHTML: String }
struct Envelope<T: Decodable>: Decodable { let data: T }

let (data, _) = try await URLSession.shared.data(from: URL(string: "https://api.example.com/v1/story")!)
let html = try sharedDecoder.decode(Envelope<Story>.self, from: data).data.bodyHTML
print(try SwiftSoup.parse(html).text())
