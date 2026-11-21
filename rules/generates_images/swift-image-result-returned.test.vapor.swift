// lexcode-expect: 1
// In a Vapor file: a trailing closure of one parameter that is not a route (a job pool's `run`) returns
// a generated picture and is counted; the route closure is the evidence rule's response and is not.
import OpenAI
import Vapor

final class JobPool {
    func run(_ body: @escaping (String) async throws -> String) {}
}

func routes(_ app: Application, openAI: OpenAI, pool: JobPool) throws {
    pool.run { job in
        let result = try await openAI.images(query: ImagesQuery(prompt: job))
        return result.data.first?.url ?? job
    }
    app.post("draw") { req in
        let result = try await openAI.images(query: ImagesQuery(prompt: "a cat"))
        return result.data.first?.url ?? ""
    }
}
