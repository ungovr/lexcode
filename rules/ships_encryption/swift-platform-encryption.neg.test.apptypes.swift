// lexcode-expect: 0
import Foundation

// An app's own types that share CryptoKit's short names, in a file that does not import CryptoKit:
// a settings screen's "AES" section and a game's "GCM" round, and a session type whose method
// happens to be called sharedSecretFromKeyAgreement.
enum AES {
    enum GCM {
        static func seal(_ value: Data, using level: Int) -> Data { value }
        static func open(_ value: Data, using level: Int) -> Data { value }
    }
}

enum ChaChaPoly {
    static func seal(_ value: Data, using level: Int) -> Data { value }
}

struct PairingSession {
    func sharedSecretFromKeyAgreement(with peer: String) -> String { peer }
}

func run(session: PairingSession, value: Data) -> Data {
    _ = session.sharedSecretFromKeyAgreement(with: "peer")
    _ = ChaChaPoly.seal(value, using: 1)
    return AES.GCM.open(AES.GCM.seal(value, using: 1), using: 1)
}
