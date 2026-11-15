// lexcode-expect: 0
// The file calls a model, but the functions that return name no model call and return nothing the model
// wrote: the return sink's scope leaves them out.
import OpenAI

struct Drafts {
    let openAI = OpenAI(apiToken: "token")

    func logDraft(_ query: ChatQuery) async throws {
        let result = try await openAI.chats(query: query)
        print(result.usage as Any)
    }

    func placeholder() -> String {
        return "Draft pending"
    }
}
