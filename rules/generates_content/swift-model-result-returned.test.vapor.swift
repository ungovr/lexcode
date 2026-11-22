// lexcode-expect: 1
// In a Vapor file: a trailing closure of one parameter that is not a route (a job pool's `run`) returns
// Gemini's answer and is counted; the route closure is the evidence rule's response and is not.
import GoogleGenerativeAI
import Vapor

final class JobPool {
    func run(_ body: @escaping (String) async throws -> String) {}
}

func routes(_ app: Application, model: GenerativeModel, pool: JobPool) throws {
    pool.run { job in
        let response = try await model.generateContent(job)
        return response.text ?? job
    }
    app.post("ask") { req in
        let response = try await model.generateContent("hello")
        return response.text ?? ""
    }
}
