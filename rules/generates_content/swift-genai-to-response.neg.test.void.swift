// lexcode-expect: 0
// Handlers of one statement that return Void or `()` in each spelling (typed throws, a parenthesized
// Void, the return type on its own line) have no implicit return, so the model call they make is not
// their response.
import GoogleGenerativeAI
import Vapor

struct GeminiWarmup {
    let model = GenerativeModel(name: "gemini-1.5-flash", apiKey: "key")

    func typed(req: Request) async throws(Abort) -> Void {
        _ = try? await model.generateContent("ping")
    }

    func typedQualified(req: Request) async throws(Abort) -> Swift.Void {
        _ = try? await model.generateContent("ping")
    }

    func paren(req: Request) async throws -> (Void) {
        _ = try await model.generateContent("ping")
    }

    func unit(req: Request) async throws -> () {
        _ = try await model.generateContent("ping")
    }

    func wrapped(req: Request) async throws
        -> () {
        _ = try await model.generateContent("ping")
    }
}
