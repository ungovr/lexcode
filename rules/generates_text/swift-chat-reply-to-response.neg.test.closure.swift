// lexcode-expect: 0
// Local accumulators inside a closure in a computed property, untyped and typed: the streamed text is
// gathered and only logged, never put on screen.
import OpenAI
import SwiftUI

struct WarmUpView: View {
    let openAI: OpenAI
    let query: ChatQuery

    var body: some View {
        Color.clear
            .task {
                var output = ""
                var reply: String = ""
                do {
                    for try await chunk in openAI.chatsStream(query: query) {
                        output += chunk.choices.first?.delta.content ?? ""
                        reply.append(chunk.id)
                    }
                } catch {}
                print(output.count, reply.count)
            }
    }
}
