// lexcode-expect: 0
// No Gemini SDK is imported: the app's own GenerativeModel returns text it was handed.
import Foundation

struct GenerativeModel {
    func generateContent(_ prompt: String) async throws -> String { prompt }
}

struct EchoService {
    let model = GenerativeModel()

    func answer(_ prompt: String) async throws -> String {
        let response = try await model.generateContent(prompt)
        return response
    }
}
