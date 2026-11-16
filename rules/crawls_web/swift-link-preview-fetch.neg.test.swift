// lexcode-expect: 0
import UIKit
import LinkPresentation

/// A share sheet that builds its own preview by hand (nothing is fetched), a preview of the app's
/// own fixed link, a preview of a file on the device, and the app's development server.
final class ShareItem: NSObject, UIActivityItemSource {
    let url: URL
    let title: String

    init(url: URL, title: String) {
        self.url = url
        self.title = title
    }

    func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController) -> Any {
        url
    }

    func activityViewController(_ activityViewController: UIActivityViewController, itemForActivityType activityType: UIActivity.ActivityType?) -> Any? {
        url
    }

    func activityViewControllerLinkMetadata(_ activityViewController: UIActivityViewController) -> LPLinkMetadata? {
        let metadata = LPLinkMetadata()
        metadata.originalURL = url
        metadata.url = url
        metadata.title = title
        return metadata
    }
}

final class AboutPreview {
    func ownSite() async throws -> LPLinkMetadata {
        try await LPMetadataProvider().startFetchingMetadata(for: URL(string: "https://www.example.com/about")!)
    }

    func attachment(path: String) async throws -> LPLinkMetadata {
        try await LPMetadataProvider().startFetchingMetadata(for: URL(fileURLWithPath: path))
    }

    func devServer() async throws -> LPLinkMetadata {
        let provider = LPMetadataProvider()
        return try await provider.startFetchingMetadata(for: URLRequest(url: URL(string: "http://localhost:8080/card")!))
    }
}
