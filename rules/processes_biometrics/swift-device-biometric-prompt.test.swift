// lexcode-expect: 9
import LocalAuthentication
import Security

final class UnlockGate {
    func unlock(completion: @escaping (Bool) -> Void) {
        let context = LAContext()
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Unlock your notes") { success, _ in
            completion(success)
        }
    }

    func unlockWithReply(completion: @escaping (Bool) -> Void) {
        LAContext().evaluatePolicy(
            LAPolicy.deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Unlock your notes",
            reply: { success, _ in completion(success) }
        )
    }

    func unlockAsync() async throws -> Bool {
        let context = LAContext()
        return try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Unlock")
    }

    func unlockQualifiedAsync() async throws -> Bool {
        try await LAContext().evaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Unlock")
    }

    func unlockThroughLocal() {
        let context = LAContext()
        let policy = LAPolicy.deviceOwnerAuthenticationWithBiometrics
        context.evaluatePolicy(policy, localizedReason: "Unlock") { success, _ in
            print(success)
        }
    }

    // A keychain item that opens only with the enrolled Face ID or Touch ID
    func protectedItemAccess() -> SecAccessControl? {
        let current = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlockedThisDeviceOnly, .biometryCurrentSet, nil)
        let any = SecAccessControlCreateWithFlags(kCFAllocatorDefault,
                                                  kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
                                                  [.biometryAny, .privateKeyUsage],
                                                  nil)
        return current ?? any
    }

    // The flags' names before iOS 11.3
    func legacyItemAccess() -> SecAccessControl? {
        let any = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlocked, .touchIDAny, nil)
        let current = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlocked, .touchIDCurrentSet, nil)
        return any ?? current
    }
}
