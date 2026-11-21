// lexcode-expect: 1
// A main.swift script whose only download is a Foundation reader given a site's address.
import Foundation
import SwiftSoup

let page = try String(contentsOf: URL(string: "https://blog.example.org/")!)
let blog = try SwiftSoup.parse(page)
print(try blog.title())
