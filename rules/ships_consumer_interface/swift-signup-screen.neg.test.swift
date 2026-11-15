// lexcode-expect: 0
// A staff screen that creates accounts for others (the definition's exclusion), a sign-in screen
// (the nearest lookalike), a point-of-sale register, and the sign-up types that are not screens: a
// view model, a request body, a raw-value enum and a delegate extension.
import SwiftUI
import UIKit

struct AdminCreateAccountView: View {
    var body: some View { Text("Create staff account") }
}

final class StaffRegistrationViewController: UIViewController {
}

struct SignInView: View {
    var body: some View { Text("Sign in") }
}

struct CashRegisterView: View {
    var body: some View { Text("Total") }
}

final class SignUpViewModel: ObservableObject {
    @Published var email = ""
}

struct RegistrationRequest: Codable {
    let email: String
}

enum SignUpStep: String {
    case email, password
}

extension UserRegistrationViewController: UITextFieldDelegate {
    func textFieldShouldReturn(_ textField: UITextField) -> Bool { true }
}
