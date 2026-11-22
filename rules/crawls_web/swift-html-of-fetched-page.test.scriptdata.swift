// lexcode-expect: 1
// A main.swift script whose only download is `Data(contentsOf:)` given a site's address.
import Foundation
import Kanna

let bytes = try Data(contentsOf: URL(string: "https://shop.example.net/catalog")!)
let shop = try Kanna.HTML(html: String(decoding: bytes, as: UTF8.self), encoding: .utf8)
print(shop.title ?? "")
