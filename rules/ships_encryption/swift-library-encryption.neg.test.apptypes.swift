// lexcode-expect: 0
import Foundation

// The app's own types with the libraries' short names, in a file without any library import: a
// toy cipher for a puzzle game, a mail "box" reached through a receiver (the shape the
// swift-sodium patterns read, so only the missing `import Sodium` keeps it out), and a signal
// flare game's own signalEncrypt (only the missing `import LibSignalClient` keeps it out).
struct AES {
    let key: [UInt8]
    init(key: [UInt8], blockMode: String, padding: String) { self.key = key }
    func encrypt(_ bytes: [UInt8]) -> [UInt8] { bytes.map { $0 ^ (key.first ?? 0) } }
}

struct ChaCha20 {
    init(key: [UInt8], iv: [UInt8]) {}
}

struct Encrypter {
    init(keyManagementAlgorithm: String, contentEncryptionAlgorithm: String, encryptionKey: String) {}
}

func signalEncrypt(message: String, for flare: Int) -> String { "\(flare):\(message)" }

final class Mailroom {
    final class Box {
        func seal(message: [UInt8], recipientPublicKey: [UInt8]) -> [UInt8]? { message }
        func open(message: [UInt8]) -> [UInt8]? { message }
    }
    let box = Box()
    let secretBox = Box()

    func play(mailroom: Mailroom) async throws {
        let cipher = AES(key: [1, 2], blockMode: "cbc", padding: "none")
        _ = cipher.encrypt([3])
        _ = ChaCha20(key: [1], iv: [2])
        _ = Encrypter(keyManagementAlgorithm: "a", contentEncryptionAlgorithm: "b", encryptionKey: "c")
        _ = self.box.seal(message: [1], recipientPublicKey: [2])
        _ = mailroom.secretBox.open(message: [1])
        _ = signalEncrypt(message: "red", for: 3)
    }
}
