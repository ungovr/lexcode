// lexcode-expect: 0
import SwiftUI
import RealityKit

// A Vision Pro app: a SwiftUI app that installs a UIKit delegate and opens an immersive space and a
// volumetric window, scenes only visionOS has. A headset app is not a phone or tablet app.
final class SpaceDelegate: NSObject, UIApplicationDelegate {}

@main
struct GalleryApp: App {
    @UIApplicationDelegateAdaptor(SpaceDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup(id: "globe") {
            Text("Globe")
        }
        .windowStyle(.volumetric)

        ImmersiveSpace(id: "gallery") {
            RealityView { _ in }
        }
    }
}
