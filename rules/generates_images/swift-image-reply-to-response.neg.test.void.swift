// lexcode-expect: 0
// Handlers of one statement that return Void or `()` in each spelling (typed throws, a parenthesized
// Void, the return type on its own line) have no implicit return, so the model call they make is not
// their response.
import OpenAI
import Vapor

struct ImageWarmup {
    let openAI: OpenAI

    func typed(req: Request) async throws(Abort) -> Void {
        _ = try? await openAI.images(query: ImagesQuery(prompt: "a cat"))
    }

    func typedQualified(req: Request) async throws(Abort) -> Swift.Void {
        _ = try? await openAI.images(query: ImagesQuery(prompt: "a cat"))
    }

    func paren(req: Request) async throws -> (Void) {
        _ = try await openAI.images(query: ImagesQuery(prompt: "a cat"))
    }

    func unit(req: Request) async throws -> () {
        _ = try await openAI.images(query: ImagesQuery(prompt: "a cat"))
    }

    func wrapped(req: Request) async throws
        -> () {
        _ = try await openAI.images(query: ImagesQuery(prompt: "a cat"))
    }
}
