// lexcode-expect: 0
// The model's output goes into a local variable with an output name, in a function that has a return type,
// and is never shown or sent: a local is not a screen. Without the local-`var` exclusions each assignment
// below would be a state-sink match. Nothing the model wrote is returned.
import OpenAI

struct DraftLog {
    let openAI = OpenAI(apiToken: "token")

    func measure(_ query: ChatQuery) async throws -> Int {
        var answer = ""
        let result = try await openAI.chats(query: query)
        answer = result.choices.first?.message.content ?? ""
        print(answer.isEmpty)
        return 1
    }

    func measureTyped(_ query: ChatQuery) async throws -> Int {
        var summaryText: String = ""
        for try await chunk in openAI.chatsStream(query: query) {
            summaryText += chunk.choices.first?.delta.content ?? ""
        }
        print(summaryText.isEmpty)
        return 1
    }
}
