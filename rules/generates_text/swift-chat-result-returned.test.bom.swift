import OpenAI
// lexcode-expect: 1
// A file saved with a UTF-8 byte order mark before its first line, which is the import: the
// import guard reads the line after the mark.
struct WritingService {
    let openAI = OpenAI(apiToken: "token")

    func draft(_ query: ChatQuery) async throws -> String {
        let result = try await openAI.chats(query: query)
        return result.choices.first?.message.content ?? ""
    }
}
