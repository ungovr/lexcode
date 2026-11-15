// lexcode-expect: 0
import Foundation
import SafariServices
import UIKit

/// The app's own stories from its own backend, and one article a person pasted in, opened as it
/// is. Neither collects other publishers' content.
final class StoriesViewController: UIViewController {
    let api = URL(string: "https://api.mynewsroom.example/v1/stories")!

    func load() async throws -> Data {
        try await URLSession.shared.data(from: api).0
    }

    func openPasted(_ text: String) {
        guard let url = URL(string: text) else { return }
        present(SFSafariViewController(url: url), animated: true)
    }

    // A help page about news APIs, held as plain text and never requested.
    let note = "Our stories come from our own newsroom, not newsapi.org."
}
