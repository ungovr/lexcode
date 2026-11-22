// lexcode-expect: 1
// A main.swift script that streams a page with URLSession's `bytes(from:)` and parses it.
import Foundation
import SwiftSoup

let (stream, _) = try await URLSession.shared.bytes(from: URL(string: "https://news.example.com/")!)
var html = ""
for try await line in stream.lines { html += line }
let document = try SwiftSoup.parse(html)
print(try document.text())
