// lexcode-expect: 4
// The reply handed to a completion closure whose capture list is not exactly `[weak self]`: one capture of
// another kind, or two captures.
import OpenAI
import UIKit

final class ReplyViewController: UIViewController {
    let openAI = OpenAI(apiToken: "sk-test")
    let label = UILabel()
    weak var delegate: AnyObject?
    var answer = ""

    func ask(_ query: ChatQuery) {
        openAI.chats(query: query) { [unowned self] result in
            if case .success(let reply) = result {
                self.label.text = reply.choices.first?.message.content
            }
        }
        openAI.chats(query: query) { [weak self, weak delegate] result in
            guard let self, delegate != nil else { return }
            switch result {
            case .success(let reply):
                self.answer = reply.choices.first?.message.content ?? ""
            case .failure:
                break
            }
        }
        openAI.chats(query: query) { [self] result in
            if case .success(let reply) = result {
                answer = reply.id
            }
        }
        openAI.chatsStream(query: query) { [weak self] partial in
            if case .success(let chunk) = partial {
                self?.answer += chunk.choices.first?.delta.content ?? ""
            }
        } completion: { [weak self] _ in
            self?.label.isHidden = false
        }
    }
}
