// lexcode-expect: 0
import LocalAuthentication
import Security

// A policy or keychain item that also opens with the passcode or an Apple Watch is not
// biometrics-only, and canEvaluatePolicy only asks whether the hardware is there.
final class PasscodeGate {
    var hasFaceID: Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
            && context.biometryType == .faceID
    }

    func unlock() {
        LAContext().evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Unlock") { success, _ in
            print(success)
        }
    }

    func unlockWithWatch() {
        LAContext().evaluatePolicy(.deviceOwnerAuthenticationWithBiometricsOrWatch, localizedReason: "Unlock") { success, _ in
            print(success)
        }
    }

    func itemAccess() -> SecAccessControl? {
        let presence = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlocked, .userPresence, nil)
        let either = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlocked, [.biometryAny, .or, .devicePasscode], nil)
        return presence ?? either
    }
}
