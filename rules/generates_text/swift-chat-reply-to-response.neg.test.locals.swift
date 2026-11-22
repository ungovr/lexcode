// lexcode-expect: 0
// A local accumulator outside any function: in a closure in top-level code (a main.swift script) with
// no parameter, one, two, a capture list, or a capture list and a parameter (one of them typed), and
// in an init. Each
// collects the reply and prints it; none is a screen.
import OpenAI

let client = OpenAI(apiToken: "token")

Task {
    var reply = ""
    for try await chunk in client.chatsStream(query: ChatQuery(messages: [], model: .gpt4_o)) {
        reply += chunk.choices.first?.delta.content ?? ""
    }
    print(reply)
}

Task { [client] in
    var answer = ""
    for try await chunk in client.chatsStream(query: ChatQuery(messages: [], model: .gpt4_o)) {
        answer += chunk.choices.first?.delta.content ?? ""
    }
    print(answer)
}

try await withThrowingTaskGroup(of: Void.self) { group in
    var reply = ""
    for try await chunk in client.chatsStream(query: ChatQuery(messages: [], model: .gpt4_o)) {
        reply += chunk.choices.first?.delta.content ?? ""
    }
    print(reply)
}

try await run { query, label in
    var text = ""
    for try await chunk in client.chatsStream(query: query) {
        text.append(chunk.choices.first?.delta.content ?? "")
    }
    print(label, text)
}

try await withThrowingTaskGroup(of: Void.self) { [client] group in
    var summary: String = ""
    for try await chunk in client.chatsStream(query: ChatQuery(messages: [], model: .gpt4_o)) {
        summary += chunk.choices.first?.delta.content ?? ""
    }
    print(summary)
}

func run(_ body: (ChatQuery, String) async throws -> Void) async throws {
    try await body(ChatQuery(messages: [], model: .gpt4_o), "run")
}

final class Summarizer {
    init(query: ChatQuery) async throws {
        var summary: String = ""
        for try await chunk in client.chatsStream(query: query) {
            summary += chunk.choices.first?.delta.content ?? ""
        }
        print(summary)
    }

    init(stream query: ChatQuery) {
        Task {
            var output = ""
            for try await chunk in client.chatsStream(query: query) {
                output += chunk.choices.first?.delta.content ?? ""
            }
            print(output)
        }
    }
}
