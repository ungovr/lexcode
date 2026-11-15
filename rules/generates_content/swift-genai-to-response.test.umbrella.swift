// lexcode-expect: 2
// A file that reaches Firebase through the umbrella import and names the product by its own type:
// `FirebaseAI.firebaseAI` and `VertexAI.vertexAI` carry the vendor's name, so they admit the file.
import Firebase
import SwiftUI

struct CaptionView: View {
    @State private var caption = ""

    var body: some View {
        Text(caption)
            .task {
                do {
                    let model = FirebaseAI.firebaseAI(backend: .googleAI()).generativeModel(modelName: "gemini-2.5-flash")
                    let response = try await model.generateContent("Caption this scene")
                    caption = response.text ?? ""
                } catch {
                    caption = ""
                }
            }
    }
}

final class LegacyCaptioner {
    var captionText = ""

    func run() async throws {
        let model = VertexAI.vertexAI().generativeModel(modelName: "gemini-2.0-flash")
        let response = try await model.generateContent("Caption")
        captionText = response.text ?? ""
    }
}
