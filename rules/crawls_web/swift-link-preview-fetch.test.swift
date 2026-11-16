// lexcode-expect: 4
import UIKit
import LinkPresentation

/// A chat app that shows a preview of each link a person posts.
final class PreviewLoader {
    func preview(for url: URL, completion: @escaping (LPLinkMetadata?) -> Void) {
        let provider = LPMetadataProvider()
        provider.startFetchingMetadata(for: url) { metadata, _ in
            completion(metadata)
        }
    }

    func previewAsync(url: URL) async throws -> LPLinkMetadata {
        try await LPMetadataProvider().startFetchingMetadata(for: url)
    }

    func previewPosted(_ message: Message) async throws -> LPLinkMetadata? {
        guard let link = message.link else { return nil }
        let provider = LPMetadataProvider()
        provider.timeout = 10
        return try await provider.startFetchingMetadata(
            for: URLRequest(url: link)
        )
    }

    func previewText(_ text: String, completion: @escaping (LPLinkMetadata?) -> Void) {
        guard let url = URL(string: text) else { return }
        LPMetadataProvider().startFetchingMetadata(for: url, completionHandler: { metadata, _ in
            completion(metadata)
        })
    }
}

struct Message {
    let link: URL?
}
