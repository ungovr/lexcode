// lexcode-expect: 5
// swift-tools-version: 5.9
import PackageDescription

// A package that offers other packages a library (static and dynamic), a command-line program and
// a build-tool plugin; one more library is declared in a products list built before the Package
// call, written with the type's own name.
let extraProducts: [Product] = [
    Product.library(name: "KitTesting", targets: ["KitTesting"]),
]

let package = Package(
    name: "Kit",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "Kit", targets: ["Kit"]),
        .library(
            name: "KitDynamic",
            type: .dynamic,
            targets: ["Kit"]
        ),
        .executable(name: "kit", targets: ["KitCLI"]),
        .plugin(name: "KitLint", targets: ["KitLint"]),
    ] + extraProducts,
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.3.0"),
    ],
    targets: [
        .target(name: "Kit"),
        .target(name: "KitTesting", dependencies: ["Kit"]),
        .executableTarget(
            name: "KitCLI",
            dependencies: ["Kit", .product(name: "ArgumentParser", package: "swift-argument-parser")]
        ),
        .plugin(name: "KitLint", capability: .buildTool()),
        .testTarget(name: "KitTests", dependencies: ["Kit"]),
    ]
)
