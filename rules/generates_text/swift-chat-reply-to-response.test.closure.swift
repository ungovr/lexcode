// lexcode-expect: 1
// A SwiftUI view whose `.task` closure, inside the computed `body`, gathers a streamed reply in a local
// variable and then puts it on screen: the screen's state is the sink, the local accumulator is not.
import OpenAI
import SwiftUI

struct ChatView: View {
    @State private var answer = ""
    let openAI: OpenAI
    let query: ChatQuery

    var body: some View {
        Text(verbatim: "Thinking")
            .task {
                var output = ""
                do {
                    for try await chunk in openAI.chatsStream(query: query) {
                        output += chunk.choices.first?.delta.content ?? ""
                    }
                } catch {}
                answer = output
            }
    }
}
