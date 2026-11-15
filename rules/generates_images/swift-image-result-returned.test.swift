// lexcode-expect: 6
// A service that returns pictures made by an image model to its caller.
import ImagePlayground
import OpenAI
import SwiftOpenAI

struct PictureService {
    let openAI = OpenAI(apiToken: "token")
    let service = OpenAIServiceFactory.service(apiKey: "token")

    func paint(_ query: ImagesQuery) async throws -> URL? {
        let result = try await openAI.images(query: query)
        return URL(string: result.data.first?.url ?? "")
    }

    func paintLegacy(_ parameters: ImageCreateParameters) async throws -> [URL?] {
        let urls = try await service.legacyCreateImages(parameters: parameters).data.map(\.url)
        return urls
    }

    func sketch(_ prompt: String) async throws -> CGImage? {
        let creator = try await ImageCreator()
        for try await picture in creator.images(for: [.text(prompt)], style: .sketch, limit: 1) {
            return picture.cgImage
        }
        return nil
    }
}

// A nested function that returns the picture, under a method with no return type, under a Task in such a
// method, and under an init: the enclosing body names the call, so the return is in scope.
extension PictureService {
    func logPaint(_ query: ImagesQuery) async throws {
        let result = try await openAI.images(query: query)
        func firstURL() -> URL? {
            return URL(string: result.data.first?.url ?? "")
        }
        print(firstURL() as Any)
    }

    func paintLater(_ query: ImagesQuery) {
        Task {
            let result = try await openAI.images(query: query)
            func firstURL() -> URL? {
                return URL(string: result.data.first?.url ?? "")
            }
            print(firstURL() as Any)
        }
    }
}

final class Poster {
    var url: URL?

    init(service: PictureService, query: ImagesQuery) async throws {
        let result = try await service.openAI.images(query: query)
        func firstURL() -> URL? {
            return URL(string: result.data.first?.url ?? "")
        }
        url = firstURL()
    }
}
