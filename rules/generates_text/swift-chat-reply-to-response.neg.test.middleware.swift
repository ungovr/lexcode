// lexcode-expect: 0
// A Vapor service that imports OpenAI, with a middleware whose respond(to:) is Vapor's, not Foundation
// Models': the response it returns is the next handler's, not a model's. Foundation Models' respond and
// streamResponse count only in a file that imports FoundationModels.
import OpenAI
import Vapor

struct TimingMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        let response = try await next.respond(to: request)
        response.headers.add(name: "X-Elapsed", value: "0")
        return response
    }
}

final class SessionStore {
    var answer = ""

    func respond(to text: String) async throws -> String { text.uppercased() }

    func echo(_ text: String) async throws {
        let reply = try await respond(to: text)
        answer = reply
    }

    func replay(_ text: String) async throws {
        let reply = try await self.respond(to: text)
        self.answer = reply
    }
}
