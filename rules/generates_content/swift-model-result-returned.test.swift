// lexcode-expect: 6
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

// A nested function that returns Gemini's output, under a method with no return type, under a Task in such
// a method, and under an init: the enclosing body names the call, so the return is in scope.
extension GeminiService {
    func logAnswer(_ prompt: String) async throws {
        let response = try await model.generateContent(prompt)
        func text() -> String {
            return response.text ?? ""
        }
        print(text())
    }

    func answerLater(_ prompt: String) {
        Task {
            let response = try await model.generateContent(prompt)
            func text() -> String {
                return response.text ?? ""
            }
            print(text())
        }
    }
}

final class Caption {
    var line = ""

    init(service: GeminiService, prompt: String) async throws {
        let response = try await service.model.generateContent(prompt)
        func text() -> String {
            return response.text ?? ""
        }
        line = text()
    }
}
