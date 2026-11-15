// lexcode-expect: 0
import Foundation

// An app's own types with the manifest's names, in a file that does not import PackageDescription:
// a media app's source of shelves, one of them the user's library.
enum Shelf {
    case library(name: String, targets: [String])
    case executable(name: String, targets: [String])
    case plugin(name: String, targets: [String])
}

struct Product {
    static func library(name: String, targets: [String]) -> Shelf { .library(name: name, targets: targets) }
}

struct Package {
    let name: String
    let products: [Shelf]
}

let shelves = Package(
    name: "Shelves",
    products: [
        .library(name: "Music", targets: ["Songs"]),
        .executable(name: "Player", targets: ["Now"]),
        .plugin(name: "Visualizer", targets: ["Bars"]),
        Product.library(name: "Podcasts", targets: ["Shows"]),
    ]
)
