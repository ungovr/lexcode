// lexcode-expect: 0
// A main.swift script that parses HTML it holds itself or reads from a file on the device, one that
// decodes a JSON API before it parses an HTML field, and a page on the local machine.
import Foundation
import SwiftSoup

let bundled = try SwiftSoup.parse("<p>Hello</p>")
print(try bundled.text())

let saved = try String(contentsOf: URL(fileURLWithPath: "/tmp/page.html"))
let local = try SwiftSoup.parse(saved)
print(try local.text())

let localhost = try String(contentsOf: URL(string: "http://localhost:8080/")!)
print(try SwiftSoup.parse(localhost).text())
