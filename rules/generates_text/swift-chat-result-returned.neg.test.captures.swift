// lexcode-expect: 0
// A function that waits for a completion closure with a capture list on a call that is not a model's: an
// app's own profile client in a file that imports OpenAI.
import Foundation
import OpenAI

final class ProfileClient {
    func profile(query: String, completion: @escaping (Result<String, Error>) -> Void) { completion(.success(query)) }
}

final class ProfileService {
    let client = ProfileClient()

    func name() -> String {
        let semaphore = DispatchSemaphore(value: 0)
        var answer = ""
        client.profile(query: "me") { [weak self, semaphore] result in
            if case .success(let name) = result { answer = name }
            semaphore.signal()
        }
        semaphore.wait()
        return answer
    }
}
