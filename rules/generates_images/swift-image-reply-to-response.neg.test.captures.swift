// lexcode-expect: 0
// Completion closures with capture lists on calls that are not a model's: an app's own gallery client in a
// file that imports OpenAI, whose picture reaches the screen.
import OpenAI
import UIKit

final class GalleryClient {
    func gallery(query: String, completion: @escaping (Result<URL, Error>) -> Void) {
        completion(.success(URL(fileURLWithPath: query)))
    }
}

final class GalleryViewController: UIViewController {
    let client = GalleryClient()
    let imageView = UIImageView()
    var artworkURL: URL?

    func load() {
        client.gallery(query: "me") { [unowned self] result in
            if case .success(let url) = result { artworkURL = url }
        }
        client.gallery(query: "me") { [weak self, weak imageView] result in
            if case .success(let url) = result { self?.artworkURL = url; imageView?.isHidden = false }
        }
    }
}
