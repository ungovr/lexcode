// lexcode-expect: 0
// A main.swift script that reads a JSON object with JSONSerialization, then parses one HTML field.
import Foundation
import SwiftSoup

let (raw, _) = try await URLSession.shared.data(from: URL(string: "https://api.example.com/v1/raw")!)
let object = try JSONSerialization.jsonObject(with: raw) as? [String: String] ?? [:]
print(try SwiftSoup.parse(object["html"] ?? "").text())
