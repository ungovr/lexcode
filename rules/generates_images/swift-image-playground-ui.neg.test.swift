// lexcode-expect: 0
// No Image Playground import. The app has its own imagePlaygroundSheet modifier and its own
// ImagePlaygroundViewController, and a photo picker for a picture the person took: the definition's
// exclusion.
import PhotosUI
import SwiftUI
import UIKit

extension View {
    func imagePlaygroundSheet(isPresented: Binding<Bool>, concept: String, onCompletion: @escaping (URL) -> Void) -> some View {
        sheet(isPresented: isPresented) { Text(concept) }
    }
}

final class ImagePlaygroundViewController: UIViewController {}

struct PickerView: View {
    @State private var show = false
    @State private var item: PhotosPickerItem?

    var body: some View {
        VStack {
            PhotosPicker("Choose a photo", selection: $item, matching: .images)
            Button("Templates") { show = true }
                .imagePlaygroundSheet(isPresented: $show, concept: "frame") { _ in }
        }
    }

    func open(from host: UIViewController) {
        host.present(ImagePlaygroundViewController(), animated: true)
    }
}
