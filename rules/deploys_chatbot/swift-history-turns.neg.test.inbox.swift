// lexcode-expect: 0
import Foundation

// The app's own chat service and message list in a file with no model SDK import, so a
// generic `respond(to:)` on the app's own service is not a model call: a person-to-person
// inbox where the app appends what this person sent and what the server echoed back.
final class InboxModel {
    var bubbles: [Bubble] = []
    let service = InboxService()

    func send(_ text: String) async throws {
        bubbles.append(Bubble(sender: .user, text: text))
        let echo = try await service.respond(to: text)
        bubbles.append(Bubble(sender: .server, text: echo))
    }
}
