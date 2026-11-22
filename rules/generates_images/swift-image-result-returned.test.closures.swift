// lexcode-expect: 2
// A Task's and a stored closure's own return of a generated picture, under a method with no return type.
import OpenAI

final class Studio {
    let openAI = OpenAI(apiToken: "token")
    var task: Task<String?, Error>?
    var loader: (() async throws -> String?)?

    func start(_ query: ImagesQuery) {
        task = Task {
            let result = try await openAI.images(query: query)
            return result.data.first?.url
        }
    }

    func makeLoader(_ query: ImagesQuery) {
        loader = {
            let result = try await self.openAI.images(query: query)
            return result.data.first?.url
        }
    }
}
