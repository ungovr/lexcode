// lexcode-expect: 4
import Fluent
import Vapor

// Vapor's bundled bcrypt, called directly and through the request's password hasher.
struct SignupController {
    func create(req: Request) async throws -> HTTPStatus {
        let input = try req.content.decode(Signup.self)
        let direct = try Bcrypt.hash(input.password)
        let viaRequest = try req.password.hash(input.password)
        let awaited = try await req.password.async.hash(input.password)
        let qualified = try Vapor.Bcrypt.hash(
            input.password,
            cost: 12
        )
        _ = (direct, viaRequest, awaited, qualified)
        return .created
    }
}

struct Signup: Content {
    let email: String
    let password: String
}
