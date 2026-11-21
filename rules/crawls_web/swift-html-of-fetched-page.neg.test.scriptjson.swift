// lexcode-expect: 0
// A main.swift script that reads a documented JSON API and turns one HTML field of its model into
// text, the definition's single call to a partner's documented API.
import Foundation
import SwiftSoup

struct Story: Decodable { let bodyHTML: String }

let (data, _) = try await URLSession.shared.data(from: URL(string: "https://api.example.com/v1/story")!)
let story = try JSONDecoder().decode(Story.self, from: data)
let body = try SwiftSoup.parse(story.bodyHTML)
print(try body.text())
