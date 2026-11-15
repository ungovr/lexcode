// lexcode-expect: 0
// The file calls Gemini, but the functions that return name no model call and return nothing the model
// wrote: the return sink's scope leaves them out.
import FirebaseAI

struct Answers {
    let model = FirebaseAI.firebaseAI(backend: .googleAI()).generativeModel(modelName: "gemini-2.5-flash")

    func logAnswer(_ prompt: String) async throws {
        let response = try await model.generateContent(prompt)
        print(response.usageMetadata as Any)
    }

    func placeholder() -> String {
        return "Answer pending"
    }
}
