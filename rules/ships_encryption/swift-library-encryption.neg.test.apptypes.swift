// lexcode-expect: 0
import Foundation

// The app's own types with the libraries' short names, in a file without any library import: a
// toy cipher for a puzzle game and a mail "box".
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

final class Mailroom {
    final class Box {
        func seal(message: [UInt8], recipientPublicKey: [UInt8]) -> [UInt8]? { message }
    }
    let box = Box()
    let secretBox = Box()

    func play() async throws {
        let cipher = AES(key: [1, 2], blockMode: "cbc", padding: "none")
        _ = cipher.encrypt([3])
        _ = ChaCha20(key: [1], iv: [2])
        _ = Encrypter(keyManagementAlgorithm: "a", contentEncryptionAlgorithm: "b", encryptionKey: "c")
        _ = box.seal(message: [1], recipientPublicKey: [2])
        _ = secretBox.seal(message: [1], recipientPublicKey: [2])
    }
}
