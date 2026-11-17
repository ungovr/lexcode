// lexcode-expect: 2
// A model's text returned from a function that waits for a completion closure whose capture list is not
// exactly `[weak self]`: one capture of another kind, or two captures.
import Foundation
import OpenAI

final class WritingService {
    let openAI = OpenAI(apiToken: "token")

    func draft(_ query: ChatQuery) -> String {
        var answer = ""
        openAI.chats(query: query) { [unowned self] result in
            if case .success(let reply) = result {
                answer = reply.choices.first?.message.content ?? ""
            }
        }
        return answer
    }

    func draftAndWait(_ query: ChatQuery) -> String {
        let semaphore = DispatchSemaphore(value: 0)
        var answer = ""
        openAI.chats(query: query) { [weak self, semaphore] result in
            if case .success(let reply) = result {
                answer = reply.choices.first?.message.content ?? ""
            }
            semaphore.signal()
        }
        semaphore.wait()
        return answer
    }
}
