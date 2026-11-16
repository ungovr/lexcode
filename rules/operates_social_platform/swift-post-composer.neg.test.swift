// lexcode-expect: 0
// A feedback composer whose text only staff read (the definition's exclusion), an email and a
// message composer, a bare compose view that names no post, a staff announcement composer, and the
// compose types that are not screens: a view model, a delegate protocol, a strings enum and a
// delegate extension.
import SwiftUI
import UIKit

struct FeedbackCommentComposerView: View {
    var body: some View { Text("Tell us what you think") }
}

final class EmailComposeViewController: UIViewController {
}

struct NewMessageView: View {
    var body: some View { Text("To:") }
}

struct ComposeView: View {
    var body: some View { Text("Draft") }
}

struct AdminNewPostView: View {
    var body: some View { Text("Announcement") }
}

final class ReplyComposeViewModel: ObservableObject {
    @Published var text = ""
}

protocol ReplyComposeDelegate: AnyObject {
    func didPost()
}

enum ReplyComposeStrings: String {
    case title = "Reply"
}

extension TopicReplyComposeViewController: UITextViewDelegate {
    func textViewDidChange(_ textView: UITextView) {}
}
