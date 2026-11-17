// lexcode-expect: 2
// The picture handed to a completion closure whose capture list is not exactly `[weak self]`: one capture
// of another kind, or two captures.
import OpenAI
import UIKit

final class ArtViewController: UIViewController {
    let openAI = OpenAI(apiToken: "token")
    let imageView = UIImageView()
    var artworkURL: URL?

    func paint(_ query: ImagesQuery) {
        openAI.images(query: query) { [unowned self] result in
            if case .success(let images) = result {
                self.artworkURL = URL(string: images.data.first?.url ?? "")
            }
        }
        openAI.imageEdits(query: query) { [weak self, weak imageView] result in
            guard let self, imageView != nil else { return }
            if case .success(let images) = result {
                self.artworkURL = URL(string: images.data.first?.url ?? "")
            }
        }
    }
}
