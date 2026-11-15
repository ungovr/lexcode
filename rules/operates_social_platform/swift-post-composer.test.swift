// lexcode-expect: 4
import SwiftUI
import UIKit

// A SwiftUI composer for a new post to the app's own service.
struct NewPostView: View {
    @State private var text = ""
    let publish: (String) async throws -> Void

    var body: some View {
        TextEditor(text: $text)
        Button("Post") {
            Task { try await publish(text) }
        }
    }
}

// A UIKit composer for a reply in a discussion, on the app's own base view controller.
class TopicReplyComposeViewController: ThemeableViewController, UITextViewDelegate {
    @IBAction func send(_ sender: UIBarButtonItem) {
        Task { try await DiscussionService.shared.reply(text: textView.text) }
    }
}

// A comment composer view inside a thread screen.
final class CommentComposerView: SetupView {
}

// A controller with no superclass that drives the reply composer.
final class ThreadReplyComposeController {
    weak var delegate: AnyObject?
}
