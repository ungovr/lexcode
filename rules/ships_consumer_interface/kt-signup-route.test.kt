// lexcode-expect: 8
// Public sign-up pages and endpoints: Spring MVC mappings (plain, named value and array forms),
// JAX-RS and servlet paths, and Ktor routes whose handler answers through the call.
package demo.web

import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import jakarta.ws.rs.Path
import jakarta.servlet.annotation.WebServlet
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class SignUpController {
    @PostMapping("/signup")
    fun signUp(): String = "ok"

    @GetMapping(value = ["/register"])
    fun form(): String = "form"

    @RequestMapping(path = ["/api/v1/users/sign-up"])
    fun create(): String = "ok"
}

@Path("/registration")
class RegistrationResource

@WebServlet("/create-account")
class CreateAccountServlet

fun Route.accountRoutes() {
    post("/signup") {
        call.respond("created")
    }
    route("/register") {
        get { call.respond("form") }
    }
    authenticate("admin") {
        post("/register") { call.respond("created by staff") }
    }
    route("/admin") {
        post("/signup") { call.respond("created by staff") }
    }
    get("/login") { call.respond("login") }
    post("/accounts/register") {
        call.respond("created")
    }
}
