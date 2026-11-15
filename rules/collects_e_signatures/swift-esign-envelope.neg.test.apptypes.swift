// lexcode-expect: 0
import UIKit

// The app's own manager with DocuSign's method names, in a file without DocuSignSDK: a card game
// that "signs" a player in to a table and composes a message envelope.
final class TableManager {
    func presentSigning(withPresenting host: UIViewController, envelopeId: String, animated: Bool) {}
    func composeEnvelope(with text: String) async throws -> String { text }
}

final class GameViewController: UIViewController {
    let table = TableManager()

    func join() async throws {
        table.presentSigning(withPresenting: self, envelopeId: "seat-4", animated: true)
        _ = try await table.composeEnvelope(with: "gg")
    }
}
