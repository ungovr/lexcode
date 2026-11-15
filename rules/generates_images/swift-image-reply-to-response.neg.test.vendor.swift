// lexcode-expect: 0
// The file imports OpenAI, but only to write captions. Its pictures come from the app's own photo store,
// whose images(for:) shares a name with Image Playground's ImageCreator call and has neither its
// style: nor its limit: label. The photos are the person's own, which the definition leaves out.
import OpenAI
import SwiftUI
import UIKit

struct PhotoStore {
    func images(for album: String) async throws -> [UIImage] { [] }
}

@MainActor
final class GalleryModel: ObservableObject {
    @Published var images: [UIImage] = []
    @Published var image: UIImage?
    let store = PhotoStore()
    let openAI = OpenAI(apiToken: "token")

    func load(_ album: String) async throws {
        let loaded = try await store.images(for: album)
        images = loaded
        image = loaded.first
    }

    func caption(_ query: ChatQuery) async throws {
        let result = try await openAI.chats(query: query)
        print(result.choices.first?.message.content ?? "")
    }
}
