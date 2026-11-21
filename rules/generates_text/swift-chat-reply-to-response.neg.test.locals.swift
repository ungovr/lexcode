// lexcode-expect: 0
// A local accumulator outside any function: in a closure in top-level code (a main.swift script), in
// a closure of two parameters or with a capture list, in a stored closure and in an init. Each
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

[ChatQuery(messages: [], model: .gpt4_o)].enumerated().forEach { index, query in
    Task {
        var text = ""
        for try await chunk in client.chatsStream(query: query) {
            text.append(chunk.choices.first?.delta.content ?? "")
        }
        print(index, text)
    }
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
