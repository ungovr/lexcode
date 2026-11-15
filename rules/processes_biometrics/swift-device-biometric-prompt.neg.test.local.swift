// lexcode-expect: 0
import Foundation

// The app's own policy engine, in a file without LocalAuthentication: an access rule named for
// the device owner, not Face ID.
enum AccessPolicy {
    case deviceOwnerAuthenticationWithBiometrics
    case guest
}

final class PolicyEngine {
    func evaluatePolicy(_ policy: AccessPolicy, localizedReason: String, reply: (Bool) -> Void) {
        reply(policy == .guest)
    }
}

final class Door {
    let engine = PolicyEngine()

    func open() {
        engine.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Owner") { ok in
            print(ok)
        }
    }
}
