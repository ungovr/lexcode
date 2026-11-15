// lexcode-expect: 0
// Sign-up routes for staff only (the definition's exclusion: an admin group, a staff builder and a
// builder behind a sign-in guard), the nearest lookalikes (a sign-in route, a device registration
// endpoint, a registration email template). The same calls on an app's own types, in a file
// without Vapor or Hummingbird, are in the noimport fixture.
import Vapor

func routes(_ app: Application) throws {
    app.group("admin") { routes in
        routes.post("register", use: createStaffAccount)
    }
    app.grouped("internal").post("signup", use: createStaffAccount)
    let staff = app.grouped("staff")
    staff.get("register", use: staffSignupPage)
    app.grouped(User.guardMiddleware()).post("register", use: inviteUser)

    app.post("login", use: login)
    app.post("devices", "register-token", use: registerDevice)
    app.get("register-interest") { req in "ok" }
}

func page(req: Request) async throws -> View {
    try await req.view.render("emails/registration-confirmed")
}
