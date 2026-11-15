// lexcode-expect: 0
import Foundation

// The app's own property wrapper and macro with the libraries' names (its Model macro is
// declared in the app's own macro target), in a file that imports neither SwiftData nor Fluent:
// an in-memory form model.
@propertyWrapper
struct Field<Value> {
    let key: String
    var wrappedValue: Value
}

@Model
final class SignupForm {
    var email: String = ""
    var firstName: String = ""
}

struct FormState {
    @Field(key: "email") var email: String = ""
}

struct Schema {
    func field(_ name: String, _ kind: String) -> Schema { self }
}

func build() -> Schema {
    Schema().field("email", "text").field("phone", "text")
}
