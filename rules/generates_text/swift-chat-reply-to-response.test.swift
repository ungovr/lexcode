// lexcode-expect: 14
// An iOS app that writes text with MacPaw's OpenAI client, SwiftOpenAI and Apple's Foundation Models
// and shows it on screen. Each matched line puts the model's text where the person reads it.
import FoundationModels
import OpenAI
import SwiftOpenAI
import SwiftUI
import UIKit

@MainActor
final class AssistantModel: ObservableObject {
    @Published var answer: String = ""
    @Published var messages: [String] = []
    @Published var summaryText = ""
    let openAI = OpenAI(apiToken: "token")
    let service = OpenAIServiceFactory.service(apiKey: "token")
    let session = LanguageModelSession()

    func ask(_ query: ChatQuery) async throws {
        let result = try await openAI.chats(query: query)
        answer = result.choices.first?.message.content ?? ""
    }

    func askIntoList(_ query: ChatQuery) async throws {
        let result = try await openAI.chats(query: query)
        messages.append(result.choices.first?.message.content ?? "")
    }

    func askWithCallback(_ query: ChatQuery) {
        openAI.chats(query: query) { result in
            switch result {
            case .success(let chat):
                self.answer = chat.choices.first?.message.content ?? ""
            case .failure:
                break
            }
        }
    }

    func askWithCallbackIfCase(_ query: ChatQuery) {
        openAI.completions(query: CompletionsQuery(model: .gpt3_5Turbo, prompt: "Write a haiku")) { result in
            if case .success(let completion) = result {
                self.summaryText = completion.choices.first?.text ?? ""
            }
        }
    }

    func streamAnswer(_ query: ChatQuery) async throws {
        answer = ""
        for try await chunk in openAI.chatsStream(query: query) {
            answer += chunk.choices.first?.delta.content ?? ""
        }
    }

    func streamWithClosures(_ query: ChatQuery) {
        openAI.chatsStream(query: query) { partial in
            self.answer = partial.description
        } completion: { error in
            print(error as Any)
        }
    }

    func askOptional(_ query: ChatQuery) async {
        guard let result = try? await openAI.chats(query: query) else { return }
        answer = result.choices.first?.message.content ?? ""
    }

    func askUnwrapped(_ query: ChatQuery) async throws {
        let result = try await openAI.chats(query: query)
        guard let text = result.choices.first?.message.content, !text.isEmpty else { return }
        answer = text
    }

    func askIntoLabel(_ query: ChatQuery, label: UILabel) async throws {
        let result = try await openAI.chats(query: query)
        if let text = result.choices.first?.message.content {
            label.text = text
        }
    }

    func askSwiftOpenAI(_ parameters: ChatCompletionParameters) async throws {
        let choices = try await service.startChat(parameters: parameters).choices
        self.answer = choices.first?.message?.content ?? ""
    }

    func respondOnDevice(_ prompt: String) async throws {
        let response = try await session.respond(to: prompt)
        summaryText = response.content
    }

    func streamOnDevice(_ prompt: String) async throws {
        let stream = session.streamResponse(to: prompt)
        for try await partial in stream {
            self.summaryText = partial.content
        }
    }

    func respondOnMain(_ prompt: String) async throws {
        let response = try await LanguageModelSession(instructions: "Be brief.").respond(to: prompt)
        await MainActor.run {
            self.answer = response.content
        }
    }
}

struct HaikuView: View {
    @State private var poem = ""
    let session = LanguageModelSession()

    var body: some View {
        VStack {
            Text(poem)
        }
        .task {
            do {
                let response = try await session.respond(to: "Write a haiku about rain.")
                showPoem(response.content)
            } catch {
                poem = "Unavailable"
            }
        }
    }

    func showPoem(_ value: String) {}

    func render() async throws -> some View {
        let response = try await session.respond(to: "One line about snow.")
        return Text(response.content)
    }
}
