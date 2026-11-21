// lexcode-expect: 0
// A function in a script that downloads and parses a page, then reads a JSON API: the function form's
// body check leaves it out, and the script form must not read it either.
import Foundation
import SwiftSoup

struct Meta: Decodable { let title: String }

func refresh() async throws {
    let (page, _) = try await URLSession.shared.data(from: URL(string: "https://news.example.com/")!)
    let document = try SwiftSoup.parse(String(decoding: page, as: UTF8.self))
    let (data, _) = try await URLSession.shared.data(from: URL(string: "https://api.example.com/v1/meta")!)
    let meta = try JSONDecoder().decode(Meta.self, from: data)
    print(try document.title(), meta.title)
}
