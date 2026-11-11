// lexcode-expect: 7
// Cookies whose names mark them as analytics, advertising or visitor-identifier cookies: servlet,
// Spring and Ktor cookies, written with positional and named arguments.
package demo.web

import io.ktor.http.Cookie
import io.ktor.server.application.ApplicationCall
import jakarta.servlet.http.HttpServletResponse
import java.net.HttpCookie
import org.springframework.http.ResponseCookie

class TrackingCookies {
    fun servlet(response: HttpServletResponse, clientId: String) {
        response.addCookie(jakarta.servlet.http.Cookie("_ga", clientId))
        response.addCookie(jakarta.servlet.http.Cookie("_fbp", "fb.1.1"))
    }

    fun jdk(): HttpCookie = HttpCookie("_gcl_au", "1.1")

    fun spring(visitor: String): ResponseCookie = ResponseCookie.from("visitor_id", visitor).build()

    fun named(): Cookie = Cookie(name = "ajs_anonymous_id", value = "anon")

    fun ktor(call: ApplicationCall, id: String) {
        call.response.cookies.append("_gid", id)
        call.response.cookies.append("tracking_id", id)
    }
}
