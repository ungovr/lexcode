// lexcode-expect: 0
import Foundation
import GRDB
import RealmSwift

// The nearest lookalikes: a plain GRDB database and a Realm with no encryption key (or one set
// to nil), and the system's own Data Protection, which encrypts files at rest with the
// platform's keys and is the platform's cryptography.
final class Store {
    func open(path: String) throws -> DatabaseQueue {
        var config = Configuration()
        config.prepareDatabase { db in
            try db.execute(sql: "PRAGMA foreign_keys = ON")
        }
        return try DatabaseQueue(path: path, configuration: config)
    }

    func realm() async throws -> Realm {
        var config = Realm.Configuration(schemaVersion: 3, encryptionKey: nil)
        config.encryptionKey = nil
        config.deleteRealmIfMigrationNeeded = true
        return try await Realm(configuration: config)
    }

    func protect(_ data: Data, to url: URL) throws {
        try data.write(to: url, options: .completeFileProtection)
        try FileManager.default.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: url.path)
    }

    // A key in a dictionary, read with the standard library's own API.
    func lookup(_ table: [String: Int]) -> Int? {
        table.keys.first.flatMap { table[$0] }
    }
}
