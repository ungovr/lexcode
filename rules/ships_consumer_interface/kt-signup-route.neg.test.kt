// lexcode-expect: 0
// Not a public sign-up page: the same paths under an admin controller or an admin route, a
// method restricted to a role (expression, block and typed bodies), Ktor login and logout routes, a route behind an authentication block, login and logout routes,
// a vehicle registration path, and route calls whose handler never answers through a Ktor call.
package demo.web

import io.ktor.server.application.call
import io.ktor.server.auth.authenticate
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import jakarta.annotation.security.RolesAllowed
import org.springframework.security.access.annotation.Secured
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/admin")
class AdminUsersController {
    @PostMapping("/register")
    fun register(): String = "ok"
}

@RestController
@RequestMapping(path = ["/staff/users"])
class StaffController(private val service: Service) {
    @PostMapping("/signup")
    fun create(): String = "ok"
}

@RestController
class RestrictedController {
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    fun onboard(): String = "ok"

    @Secured("ROLE_ADMIN")
    @PostMapping("/signup")
    fun onboardSecured(): String = "ok"

    @RolesAllowed("admin")
    @PostMapping("/register")
    fun onboardRoles(): String = "ok"

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    fun onboardBlock() {
        println("ok")
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    fun onboardTyped(): String {
        return "ok"
    }

    @Secured("ROLE_ADMIN")
    @PostMapping("/signup")
    fun securedBlock() {
        println("ok")
    }

    @RolesAllowed("admin")
    @PostMapping("/register")
    fun rolesBlock() {
        println("ok")
    }

    @PostMapping("/login")
    fun login(): String = "ok"

    @PostMapping("/logout")
    fun logout(): String = "ok"

    @PostMapping("/vehicles/registration")
    fun vehicle(): String = "ok"

    @PostMapping("/registrations/export")
    fun export(): String = "ok"
}

class Service

fun Route.sessionRoutes() {
    get("/login") { call.respond("login") }
    post("/logout") { call.respond("bye") }
}

fun Route.staffRoutes() {
    authenticate("staff") {
        post("/register") { call.respond("created by staff") }
    }
    route("/admin") {
        post("/signup") { call.respond("created by staff") }
        route("/register") {
            get { call.respond("form") }
        }
    }
}

class Client {
    fun call(http: Http) {
        http.post("/signup") { body("x") }
        post("/register") { body("y") }
        post("/signup") { call.enqueue(callback) }
        route("/register") {
            get { body("z") }
        }
    }
}

val callback = Any()

interface Http {
    fun post(path: String, block: () -> Unit)
}

fun post(path: String, block: () -> Unit) {}
