// lexcode-expect: 3
import Foundation
import SQLite
import SQLCipher

// SQLCipher through SQLite.swift, and its C API called directly.
final class Journal {
    func open(path: String, key: String) async throws -> Connection {
        let db = try Connection(path)
        try db.key(key)
        try await db.rekey(key + "-rotated")
        return db
    }

    func raw(handle: OpaquePointer?, key: String) {
        _ = sqlite3_key(handle, key, Int32(key.utf8.count))
    }
}
