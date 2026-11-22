// lexcode-expect: 3
// A main.swift script that downloads pages and parses them at the top level.
import Foundation
import SwiftSoup

let url = URL(string: "https://news.example.com/")!
let (data, _) = try await URLSession.shared.data(from: url)
let html = String(decoding: data, as: UTF8.self)
let document = try SwiftSoup.parse(html)
for link in try document.select("a") {
    print(try link.attr("href"))
}

let page = try String(contentsOf: URL(string: "https://blog.example.org/")!)
let blog = try SwiftSoup.parse(page)
print(try blog.title())

Task {
    let (bytes, _) = try await URLSession.shared.data(from: URL(string: "https://shop.example.net/")!)
    let shop = try SwiftSoup.parse(String(decoding: bytes, as: UTF8.self))
    print(try shop.text())
}
