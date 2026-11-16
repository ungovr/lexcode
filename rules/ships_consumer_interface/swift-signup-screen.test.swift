// lexcode-expect: 4
import SwiftUI
import UIKit

// A SwiftUI sign-up screen.
struct SignUpView: View {
    @State private var email = ""
    @State private var password = ""
    let onSubmit: (String, String) async throws -> Void

    var body: some View {
        Form {
            TextField("Email", text: $email)
            SecureField("Password", text: $password)
            Button("Create account") {
                Task { try await onSubmit(email, password) }
            }
        }
    }
}

// A UIKit account creation screen on the app's own base view controller, with a class prefix.
class WMXAccountCreationViewController: BaseScrollViewController, UITextFieldDelegate {
    @IBOutlet private var usernameField: UITextField!

    @IBAction func createAccount(_ sender: UIButton) {
        Task { try await AccountService.shared.register(username: usernameField.text ?? "") }
    }
}

// A UIKit registration screen subclassing UIViewController directly.
final class UserRegistrationViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "Join"
    }
}

// A SwiftUI view hosted in UIKit.
final class SignupHostingController: UIHostingController<SignUpView> {
}
