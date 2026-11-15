// lexcode-expect: 0
// The file calls an image model, but the functions that return name no model call and return nothing the
// model made: the return sink's scope leaves them out.
import OpenAI

struct Pictures {
    let openAI = OpenAI(apiToken: "token")

    func logPaint(_ query: ImagesQuery) async throws {
        let result = try await openAI.images(query: query)
        print(result.created)
    }

    func placeholder() -> URL? {
        return URL(string: "https://example.com/pending.png")
    }
}
