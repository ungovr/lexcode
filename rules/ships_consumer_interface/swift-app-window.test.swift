// lexcode-expect: 5
import SwiftUI
import UIKit

// A SwiftUI app's main window.
@main
struct ReaderApp: App {
    @StateObject private var store = ArticleStore()

    var body: some Scene {
        WindowGroup {
            ArticleList()
                .environmentObject(store)
        }
    }
}

// A document app, with the App conformance after another protocol.
struct NotesApp: Sendable, App {
    var body: some Scene {
        DocumentGroup(newDocument: NoteDocument()) { file in
            NoteEditor(document: file.$document)
        }
        Settings {
            PreferencesView()
        }
    }
}

// A civic app whose name holds an excluded word inside another word (Demo in Democracy).
struct DemocracyApp: App {
    var body: some Scene {
        WindowGroup {
            BallotList()
        }
    }
}

// A Scene type that the App's body names, with a single window.
struct LibraryScene: Scene {
    var body: some Scene {
        Window("Library", id: "library") {
            LibraryView()
        }
    }
}

// A UIKit app's window scene delegate.
final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = UINavigationController(rootViewController: HomeViewController())
        self.window = window
        window.makeKeyAndVisible()
    }
}
