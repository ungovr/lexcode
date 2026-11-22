// lexcode-expect: 2
// A view model whose list of pictures is named for results or outputs.
import OpenAI
import SwiftUI

@MainActor
final class StudioModel: ObservableObject {
    let openAI = OpenAI(apiToken: "token")
    @Published var results: [String] = []
    @Published var outputs: [String] = []

    func make(_ query: ImagesQuery) async throws {
        let response = try await openAI.images(query: query)
        results = response.data.compactMap(\.url)
    }

    func more(_ query: ImagesQuery) async throws {
        let response = try await openAI.images(query: query)
        outputs.append(contentsOf: response.data.compactMap(\.url))
    }
}
