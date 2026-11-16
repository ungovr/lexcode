// lexcode-expect: 0
// The model's output goes into a local variable with an output name, in a function that has a return type,
// and is never shown or sent: a local is not a screen. Without the local-`var` exclusions each assignment
// below would be a state-sink match. Nothing the model wrote is returned.
import OpenAI

struct ImageLog {
    let openAI = OpenAI(apiToken: "token")

    func measure(_ query: ImagesQuery) async throws -> Int {
        var image = ""
        let result = try await openAI.images(query: query)
        image = result.data.first?.url ?? ""
        print(image.isEmpty)
        return 1
    }

    func measureTyped(_ query: ImagesQuery) async throws -> Int {
        var photos: [String] = []
        let result = try await openAI.images(query: query)
        photos.append(result.data.first?.url ?? "")
        print(photos.count)
        return 1
    }
}
