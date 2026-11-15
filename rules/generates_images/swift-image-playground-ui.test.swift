// lexcode-expect: 3
// Image Playground opened in the app: the SwiftUI sheet, written on one line and over several, and the
// UIKit view controller.
import ImagePlayground
import SwiftUI
import UIKit

struct AvatarView: View {
    @State private var showPlayground = false
    @State private var avatarURL: URL?

    var body: some View {
        VStack {
            Button("Make an avatar") { showPlayground = true }
                .imagePlaygroundSheet(isPresented: $showPlayground, concept: "a friendly fox") { url in
                    avatarURL = url
                }
            Button("Make a sticker") { showPlayground = true }
                .imagePlaygroundSheet(
                    isPresented: $showPlayground,
                    concepts: [.text("sticker")],
                    onCompletion: { url in avatarURL = url }
                )
        }
    }
}

final class AvatarViewController: UIViewController, ImagePlaygroundViewController.Delegate {
    func present() {
        let playground = ImagePlaygroundViewController()
        playground.delegate = self
        present(playground, animated: true)
    }

    func imagePlaygroundViewController(_ imagePlaygroundViewController: ImagePlaygroundViewController, didCreateImageAt imageURL: URL) {
        dismiss(animated: true)
    }
}
