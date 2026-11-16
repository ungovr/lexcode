// lexcode-expect: 2
import Hummingbird

func buildRouter(users: UserRepository) -> Router<BasicRequestContext> {
    let router = Router()
    router.post("/register") { request, context in
        let input = try await request.decode(as: SignUpInput.self, context: context)
        try await users.create(email: input.email)
        return HTTPResponse.Status.created
    }
    router.group("api/accounts").post("signup", use: users.signUp)
    return router
}
