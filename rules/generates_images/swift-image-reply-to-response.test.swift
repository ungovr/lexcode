// lexcode-expect: 6
// An iOS app that shows pictures made by OpenAI's image models (MacPaw and SwiftOpenAI clients),
// Firebase AI Logic's Imagen and Apple's Image Playground ImageCreator.
import FirebaseAILogic
import ImagePlayground
import OpenAI
import SwiftOpenAI
import SwiftUI
import UIKit

@MainActor
final class ArtModel: ObservableObject {
    @Published var image: UIImage?
    @Published var artworkURL: URL?
    @Published var images: [CGImage] = []
    let openAI = OpenAI(apiToken: "token")
    let service = OpenAIServiceFactory.service(apiKey: "token")
    let imagen = FirebaseAI.firebaseAI(backend: .googleAI()).imagenModel(modelName: "imagen-4.0-generate-001")

    func paint(_ query: ImagesQuery) async throws {
        let result = try await openAI.images(query: query)
        artworkURL = URL(string: result.data.first?.url ?? "")
    }

    func paintWithCallback(_ query: ImagesQuery) {
        openAI.images(query: query) { result in
            switch result {
            case .success(let images):
                self.artworkURL = URL(string: images.data.first?.url ?? "")
            case .failure:
                break
            }
        }
    }

    func paintSwiftOpenAI(_ parameters: CreateImageParameters, view: UIImageView) async throws {
        let result = try await service.createImages(parameters: parameters)
        guard let b64 = result.data?.first?.b64JSON else { return }
        view.image = UIImage(data: Data(base64Encoded: b64) ?? Data())
    }

    func paintImagen(_ prompt: String) async throws {
        let response = try await imagen.generateImages(prompt: prompt)
        guard let first = response.images.first else { return }
        image = UIImage(data: first.data)
    }

    func paintOnDevice(_ prompt: String) async throws {
        let creator = try await ImageCreator()
        let created = creator.images(for: [.text(prompt)], style: .animation, limit: 2)
        for try await picture in created {
            images.append(picture.cgImage)
        }
    }
}

struct ArtView: View {
    let openAI: OpenAI
    @State private var url: URL?

    var body: some View {
        AsyncImage(url: url)
    }

    func edit(_ query: ImageEditsQuery) async throws -> some View {
        let result = try await openAI.imageEdits(query: query)
        return AsyncImage(url: URL(string: result.data.first?.url ?? ""))
    }
}
