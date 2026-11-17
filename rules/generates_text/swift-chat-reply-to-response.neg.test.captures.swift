// lexcode-expect: 0
// Completion closures with capture lists on calls that are not a model's: an app's own client in a file
// that imports OpenAI, whose result reaches the screen.
import OpenAI
import UIKit

final class ProfileClient {
    func profile(id: String, completion: @escaping (Result<String, Error>) -> Void) { completion(.success(id)) }
}

final class ProfileViewController: UIViewController {
    let client = ProfileClient()
    let label = UILabel()
    var answer = ""

    func load() {
        client.profile(id: "me") { [unowned self] result in
            if case .success(let name) = result { label.text = name }
        }
        client.profile(id: "me") { [weak self, weak label] result in
            if case .success(let name) = result { self?.answer = name; label?.text = name }
        }
    }
}
