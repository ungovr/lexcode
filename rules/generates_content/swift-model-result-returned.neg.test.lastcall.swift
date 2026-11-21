// lexcode-expect: 0
// A Task whose last statement is a call, not a return: the engine reads a closure's last statement as
// its return, and Gemini's answer is only printed.
import GoogleGenerativeAI

final class Writer {
    let model = GenerativeModel(name: "gemini-1.5-flash", apiKey: "key")

    func log(_ prompt: String) {
        Task {
            let response = try await model.generateContent(prompt)
            let output = response.text ?? ""
            print(output)
        }
    }
}
