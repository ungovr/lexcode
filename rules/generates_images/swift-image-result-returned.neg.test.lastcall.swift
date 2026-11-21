// lexcode-expect: 0
// A Task whose last statement is a call, not a return: the engine reads a closure's last statement as
// its return, and the picture's address is only printed.
import OpenAI

final class Studio {
    let openAI = OpenAI(apiToken: "token")

    func log(_ query: ImagesQuery) {
        Task {
            let result = try await openAI.images(query: query)
            let output = result.data.first?.url ?? ""
            print(output)
        }
    }
}
