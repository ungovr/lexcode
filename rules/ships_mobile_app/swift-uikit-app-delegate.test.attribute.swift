// lexcode-expect: 2
import UIKit

// The older `@UIApplicationMain` attribute on an iPhone app's delegate class. The conformance and
// the attribute are two matches over different ranges (the class, and the attribute's line).
@UIApplicationMain
class OldDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
}
