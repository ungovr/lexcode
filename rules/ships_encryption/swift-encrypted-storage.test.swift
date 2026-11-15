// lexcode-expect: 4
import Foundation
import GRDB
import RealmSwift

// SQLCipher through GRDB, and an encrypted Realm: libraries the app bundles that encrypt what it
// stores in a format of their own.
final class SecureStore {
    func open(path: String, passphrase: String) throws -> DatabaseQueue {
        var config = Configuration()
        config.prepareDatabase { db in
            try db.usePassphrase(passphrase)
        }
        return try DatabaseQueue(path: path, configuration: config)
    }

    func realm(key: Data) async throws -> Realm {
        let config = Realm.Configuration(
            schemaVersion: 3,
            encryptionKey: key,
            deleteRealmIfMigrationNeeded: true
        )
        return try await Realm(configuration: config)
    }

    func realmLater(key: Data) throws -> Realm {
        var config = Realm.Configuration.defaultConfiguration
        config.encryptionKey = key
        return try Realm(configuration: config)
    }

    func awaited(pool: DatabasePool, passphrase: String) async throws {
        try await pool.write { db in
            try db.changePassphrase(passphrase)
        }
    }
}
