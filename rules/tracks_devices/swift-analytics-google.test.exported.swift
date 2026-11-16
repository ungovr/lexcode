// lexcode-expect: 2
import UIKit

// No Firebase import here: Crashlytics comes in through an `@_exported import` in another file
// or an Objective-C bridging header. Its short name carries the product's own name.
final class ExportedCrashlytics {
    func identify(userID: String) async throws {
        Crashlytics.crashlytics().setUserID(userID)
        try await Crashlytics.crashlytics().setUserID(userID)
    }
}
