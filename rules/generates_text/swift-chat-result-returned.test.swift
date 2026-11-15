// lexcode-expect: 5
// A service layer that returns a model's text to whoever calls it, often a view model in another file.
import FoundationModels
import OpenAI
import SwiftOpenAI

struct WritingService {
    let openAI = OpenAI(apiToken: "token")
    let service = OpenAIServiceFactory.service(apiKey: "token")

    func draft(_ query: ChatQuery) async throws -> String {
        let result = try await openAI.chats(query: query)
        return result.choices.first?.message.content ?? ""
    }

    func draftOptional(_ query: ChatQuery) async throws -> String? {
        let result = try await openAI.chats(query: query)
        guard let text = result.choices.first?.message.content else { return nil }
        return text
    }

    func streamed(_ query: ChatQuery) async throws -> String {
        var text = ""
        for try await chunk in openAI.chatsStream(query: query) {
            text += chunk.choices.first?.delta.content ?? ""
        }
        return text
    }

    func viaSwiftOpenAI(_ parameters: ModelResponseParameter) async throws -> String {
        let response = try await service.responseCreate(parameters)
        return response.outputText ?? ""
    }

    func onDevice(_ prompt: String) async throws -> String {
        let session = LanguageModelSession()
        let response = try await session.respond(to: prompt)
        return response.content
    }
}
