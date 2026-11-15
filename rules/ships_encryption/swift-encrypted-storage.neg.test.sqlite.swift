// lexcode-expect: 0
import Foundation
import SQLite

// A file that imports SQLite.swift for its query builder and calls the app's own key(_:) on a
// settings store. The file never names SQLite.swift's database handle type, so the one-argument
// key call is not SQLCipher's.
final class ThemeSettings {
    func key(_ name: String) -> String { "theme." + name }
}

struct ThemeQueries {
    let settings = ThemeSettings()
    let themes = Table("themes")

    func current() async throws -> String {
        settings.key("accent")
    }
}
