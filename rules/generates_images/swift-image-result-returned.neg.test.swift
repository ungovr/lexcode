// lexcode-expect: 0
// No image model is imported: the app's own OpenAI type returns a cached URL, and a thumbnail is made
// by resizing a person's photo.
import UIKit

struct OpenAI {
    func images(query: String) async throws -> URL? { URL(string: "https://example.com/\(query).png") }
}

struct Thumbnails {
    let openAI = OpenAI()

    func cached(_ name: String) async throws -> URL? {
        let url = try await openAI.images(query: name)
        return url
    }

    func thumbnail(of photo: UIImage) -> UIImage {
        return UIGraphicsImageRenderer(size: CGSize(width: 64, height: 64)).image { _ in photo.draw(in: CGRect(x: 0, y: 0, width: 64, height: 64)) }
    }
}
