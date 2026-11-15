// lexcode-expect: 0
import Foundation

// The app's own types with the libraries' method names, in a file without GRDB, SQLite.swift or
// RealmSwift: a settings screen that stores a passphrase hint and a keychain wrapper.
final class Settings {
    var encryptionKey: Data?

    func usePassphrase(_ hint: String) {}
    func key(_ name: String) -> String? { nil }
}

final class Onboarding {
    let settings = Settings()

    func run(hint: String) async throws {
        settings.usePassphrase(hint)
        _ = settings.key("theme")
        settings.encryptionKey = Data(hint.utf8)
    }
}
