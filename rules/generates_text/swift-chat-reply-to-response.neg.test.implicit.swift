// lexcode-expect: 0
// One-expression closures that are not a route's response: a route that returns no model text, a model
// call in a closure handed to a method that is not a route (a group, a task, a queue), and a route of
// several statements whose model text is only printed, and handlers of one expression or several that
// send no model text back, among them handlers of one expression that return Void or `()` and so have no
// implicit return, though their one statement calls the model.
import OpenAI
import Vapor

func routes(_ app: Application, openAI: OpenAI, queue: DispatchQueue) throws {
    app.get("id") { req in
        req.parameters.get("id") ?? ""
    }

    app.group("v1") { v1 in
        v1.get("ping") { _ in "pong" }
    }

    queue.async {
        Task { _ = try await openAI.chats(query: ChatQuery(messages: [], model: .gpt4_o)).id }
    }

    app.post("log") { req -> String in
        let result = try await openAI.chats(query: ChatQuery(messages: [], model: .gpt4_o))
        print(result.id)
        return "ok"
    }
}

struct StatusController: RouteCollection {
    let openAI: OpenAI

    func boot(routes: RoutesBuilder) throws {
        routes.get("status", use: status)
        routes.post("warm", use: warm)
        routes.post("fire", use: fire)
        routes.post("note", use: note)
        routes.post("unit", use: unit)
    }

    func status(req: Request) async throws -> String {
        req.application.environment.name
    }

    func warm(req: Request) async throws -> HTTPStatus {
        let result = try await openAI.chats(query: ChatQuery(messages: [], model: .gpt4_o))
        req.logger.info("warmed \(result.id)")
        return .ok
    }

    func fire(req: Request) async throws -> Void {
        _ = try await openAI.chats(query: ChatQuery(messages: [], model: .gpt4_o))
    }

    func note(req: Request) async throws -> Void {
        req.logger.info("\(try await openAI.chats(query: ChatQuery(messages: [], model: .gpt4_o)).id)")
    }

    func unit(_ req: Request) async throws -> () {
        req.logger.info("\(try await openAI.chats(query: ChatQuery(messages: [], model: .gpt4_o)).id)")
    }

    func hb(_ request: HBRequest) async throws -> Swift.Void {
        _ = try await openAI.chats(query: ChatQuery(messages: [], model: .gpt4_o))
    }
}
