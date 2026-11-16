// lexcode-expect: 0
// The model's output goes into a local variable with an output name, in a function that has a return type,
// and is never shown or sent: a local is not a screen. Without the local-`var` exclusions each assignment
// below would be a state-sink match. Nothing the model wrote is returned.
import FirebaseAI

struct StoryLog {
    let model = FirebaseAI.firebaseAI(backend: .googleAI()).generativeModel(modelName: "gemini-2.5-flash")

    func measure(_ prompt: String) async throws -> Int {
        var story = ""
        let response = try await model.generateContent(prompt)
        story = response.text ?? ""
        print(story.isEmpty)
        return 1
    }

    func measureTyped(_ prompt: String) async throws -> Int {
        var caption: String = ""
        let response = try await model.generateContent(prompt)
        caption = response.text ?? ""
        print(caption.isEmpty)
        return 1
    }
}
