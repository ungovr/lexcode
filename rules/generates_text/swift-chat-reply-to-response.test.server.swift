// lexcode-expect: 6
// A Vapor service and an AWS Lambda function that send a model's text back to the caller: MacPaw's
// OpenAI client and Amazon Bedrock's Converse API.
import AWSBedrockRuntime
import AWSLambdaEvents
import OpenAI
import Vapor

struct AskController: RouteCollection {
    let openAI: OpenAI

    func boot(routes: RoutesBuilder) throws {
        routes.post("ask", use: ask)
        routes.post("ask-raw", use: askRaw)
    }

    func ask(req: Request) async throws -> String {
        let query = try req.content.decode(ChatQuery.self)
        let result = try await openAI.chats(query: query)
        return result.choices.first?.message.content ?? ""
    }

    func askRaw(_ req: Request) async throws -> Response {
        let query = try req.content.decode(ChatQuery.self)
        let result = try await openAI.responses.createResponse(query: query)
        return Response(status: .ok, body: .init(string: result.outputText))
    }
}

func routes(_ app: Application, openAI: OpenAI) throws {
    app.post("draft") { req async throws -> String in
        let query = try req.content.decode(ChatQuery.self)
        let result = try await openAI.chats(query: query)
        return result.choices.first?.message.content ?? ""
    }

    app.webSocket("live") { req, ws in
        ws.onText { ws, text in
            let query = ChatQuery(messages: [.user(.init(content: .string(text)))], model: .gpt4_o)
            let result = try await openAI.chats(query: query)
            ws.send(result.choices.first?.message.content ?? "")
        }
    }
}

struct DraftHandler {
    let client: BedrockRuntimeClient

    func handle(_ event: APIGatewayV2Request) async throws -> APIGatewayV2Response {
        let message = BedrockRuntimeClientTypes.Message(content: [.text(event.body ?? "")], role: .user)
        let input = ConverseInput(messages: [message], modelId: "amazon.nova-lite-v1:0")
        let response = try await client.converse(input: input)
        return APIGatewayV2Response(statusCode: .ok, body: "\(String(describing: response.output))")
    }

    func stream(_ event: APIGatewayV2Request, socket: WebSocket) async throws {
        let input = ConverseStreamInput(messages: [], modelId: "amazon.nova-lite-v1:0")
        let response = try await client.converseStream(input: input)
        guard let stream = response.stream else { return }
        for try await event in stream {
            socket.send(String(describing: event))
        }
    }
}
