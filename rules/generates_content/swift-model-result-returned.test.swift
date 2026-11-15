// lexcode-expect: 3
// A service that returns Gemini's output to its caller.
import FirebaseAI

struct GeminiService {
    let model = FirebaseAI.firebaseAI(backend: .googleAI()).generativeModel(modelName: "gemini-2.5-flash")

    func answer(_ prompt: String) async throws -> String {
        let response = try await model.generateContent(prompt)
        return response.text ?? ""
    }

    func answerOrNil(_ prompt: String) async throws -> String? {
        let response = try await model.generateContent(prompt)
        guard let text = response.text else { return nil }
        return text
    }

    func reply(_ line: String) async throws -> String {
        let chat = model.startChat()
        let response = try await chat.sendMessage(line)
        return response.text ?? ""
    }
}
