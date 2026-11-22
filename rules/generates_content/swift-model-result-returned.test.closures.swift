// lexcode-expect: 2
// A Task's and a stored closure's own return of Gemini's answer, under a method with no return type.
import GoogleGenerativeAI

final class Writer {
    let model = GenerativeModel(name: "gemini-1.5-flash", apiKey: "key")
    var task: Task<String?, Error>?
    var loader: (() async throws -> String?)?

    func start(_ prompt: String) {
        task = Task {
            let response = try await model.generateContent(prompt)
            return response.text
        }
    }

    func makeLoader(_ prompt: String) {
        loader = {
            let response = try await self.model.generateContent(prompt)
            return response.text
        }
    }
}
