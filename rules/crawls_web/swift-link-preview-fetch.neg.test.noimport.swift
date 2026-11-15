// lexcode-expect: 0
import Foundation

/// The app's own metadata cache, with types named like LinkPresentation's. This file does not
/// import LinkPresentation; the metadata comes from the app's own store.
struct LPLinkMetadata {
    var title: String?
}

final class LPMetadataProvider {
    private var store: [URL: LPLinkMetadata] = [:]

    func startFetchingMetadata(for url: URL, completionHandler: (LPLinkMetadata?, Error?) -> Void) {
        completionHandler(store[url], nil)
    }
}

final class CachedPreviews {
    let provider = LPMetadataProvider()

    func preview(for url: URL) {
        provider.startFetchingMetadata(for: url) { metadata, _ in
            print(metadata?.title ?? "")
        }
    }
}
