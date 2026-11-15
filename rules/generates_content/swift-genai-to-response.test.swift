// lexcode-expect: 6
// An iOS app that shows Gemini's answers, through Firebase AI Logic and Google's Generative AI SDK.
import FirebaseAILogic
import GoogleGenerativeAI
import SwiftUI

@MainActor
final class StoryModel: ObservableObject {
    @Published var story = ""
    @Published var illustration: UIImage?
    let model = FirebaseAI.firebaseAI(backend: .googleAI()).generativeModel(modelName: "gemini-2.5-flash")
    let legacy = GenerativeModel(name: "gemini-1.5-flash", apiKey: "key")

    func write(_ prompt: String) async throws {
        let response = try await model.generateContent(prompt)
        story = response.text ?? ""
    }

    func writeUnwrapped(_ prompt: String) async throws {
        let response = try await model.generateContent(prompt)
        guard let text = response.text else { return }
        self.story = text
    }

    func stream(_ prompt: String) async throws {
        let contentStream = try model.generateContentStream(prompt)
        for try await chunk in contentStream {
            story += chunk.text ?? ""
        }
    }

    func chat(_ line: String) async throws {
        let chat = model.startChat()
        let response = try await chat.sendMessage(line)
        story = response.text ?? ""
    }

    func picture(_ prompt: String) async throws {
        let response = try await model.generateContent(prompt)
        if let part = response.inlineDataParts.first {
            illustration = UIImage(data: part.data)
        }
    }

    func legacyWrite(_ prompt: String, label: UILabel) async throws {
        let response = try await legacy.generateContent(prompt)
        label.text = response.text
    }
}
