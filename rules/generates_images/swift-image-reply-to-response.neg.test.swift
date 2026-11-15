// lexcode-expect: 0
// No image model is imported. The app has its own OpenAI type with an images(query:) method and its own
// ImageCreator, and shows pictures a person took or picked, only resized: the definition's exclusion.
import PhotosUI
import SwiftUI
import UIKit

struct OpenAI {
    func images(query: String) async throws -> [URL] { [] }
}

struct ImageCreator {
    func images(for prompt: String, style: Int, limit: Int) -> [UIImage] { [] }
}

@MainActor
final class GalleryModel: ObservableObject {
    @Published var image: UIImage?
    @Published var artworkURL: URL?
    @Published var images: [UIImage] = []
    let openAI = OpenAI()
    let creator = ImageCreator()

    func load(_ query: String) async throws {
        let urls = try await openAI.images(query: query)
        artworkURL = urls.first
    }

    func stickers(_ prompt: String) {
        for picture in creator.images(for: prompt, style: 0, limit: 2) {
            images.append(picture)
        }
    }

    func picked(_ item: PhotosPickerItem) async throws {
        guard let data = try await item.loadTransferable(type: Data.self), let photo = UIImage(data: data) else { return }
        let size = CGSize(width: 512, height: 512)
        image = UIGraphicsImageRenderer(size: size).image { _ in photo.draw(in: CGRect(origin: .zero, size: size)) }
    }
}

struct PhotoView: View {
    let photo: UIImage
    var body: some View {
        Image(uiImage: photo)
            .resizable()
    }
}
