// lexcode-expect: 0
// Cookies that keep one visit working or remember a preference: the session cookie, a language and
// a theme, the CSRF token, a visitor's display name, a cookie whose name is a variable, and the same
// calls with names that only contain an analytics word.
package demo.web

import io.ktor.http.Cookie
import io.ktor.server.application.ApplicationCall
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.ResponseCookie

class PreferenceCookies(private val cookieName: String) {
    fun session(response: HttpServletResponse) {
        response.addCookie(jakarta.servlet.http.Cookie("JSESSIONID", "abc"))
        response.addCookie(jakarta.servlet.http.Cookie("SESSION", "abc"))
    }

    fun preferences(response: HttpServletResponse) {
        response.addCookie(jakarta.servlet.http.Cookie("lang", "en"))
        response.addCookie(jakarta.servlet.http.Cookie("theme", "dark"))
    }

    fun csrf(): ResponseCookie = ResponseCookie.from("XSRF-TOKEN", "t").build()

    fun greeting(): ResponseCookie = ResponseCookie.from("visitor_name", "Sam").build()

    fun dynamic(response: HttpServletResponse) {
        response.addCookie(jakarta.servlet.http.Cookie(cookieName, "v"))
    }

    fun ktor(call: ApplicationCall): Cookie {
        call.response.cookies.append("session", "abc")
        call.response.cookies.append("lang", "en")
        return Cookie(name = "theme", value = "dark")
    }

    fun lookalikes(call: ApplicationCall) {
        call.response.cookies.append("gaming_level", "3")
        call.response.cookies.append("fingerprinting_opt_out", "1")
    }
}
