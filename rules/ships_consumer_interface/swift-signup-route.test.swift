// lexcode-expect: 7
import Vapor
import Fluent

struct AuthController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let auth = routes.grouped("auth")
        auth.post("register", use: register)
        auth.get("signup") { req async throws -> View in
            try await req.view.render("auth/signup")
        }
    }

    func register(req: Request) async throws -> HTTPStatus {
        let input = try req.content.decode(SignUpInput.self)
        try await User(email: input.email, passwordHash: Bcrypt.hash(input.password)).save(on: req.db)
        return .created
    }
}

func routes(_ app: Application) throws {
    app.on(.POST, "api", "v1", "sign-up", use: signUp)
    app.grouped("users").post("create-account", use: createAccount)
    app.group("registration") { registration in
        registration.post(use: completeRegistration)
    }
}

func signupPage(req: Request) async throws -> View {
    return try await req.view.render("register", ["title": "Join"])
}
