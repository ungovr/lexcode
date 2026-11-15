// lexcode-expect: 0
// swift-tools-version: 6.0
import PackageDescription

// A server the team builds and runs itself: an executable target and its libraries, used inside
// the package, with no product offered to other packages. Its dependencies name other packages'
// products, which is using a library, not shipping one. A target plugin is the package's own
// build step.
let package = Package(
    name: "NewsletterService",
    platforms: [.macOS(.v14)],
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "4.99.0"),
    ],
    targets: [
        .executableTarget(
            name: "App",
            dependencies: [
                .product(name: "Vapor", package: "vapor"),
                .target(name: "Core"),
            ],
            plugins: [.plugin(name: "Codegen")]
        ),
        .target(name: "Core", linkerSettings: [.linkedLibrary("z")]),
        .plugin(name: "Codegen", capability: .buildTool()),
        .testTarget(name: "AppTests", dependencies: ["App"]),
    ]
)
