// lexcode-expect: 12
// The visitor's IP address written to a log line, a mapped diagnostic context, an insert statement
// or a saved record: Spring and Ktor handlers that read it from the request or from a proxy header.
package demo.web

import io.ktor.server.application.ApplicationCall
import io.ktor.server.plugins.origin
import jakarta.servlet.http.HttpServletRequest
import java.sql.Connection
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.jdbc.core.JdbcTemplate

class Visit(var ipAddress: String = "", val clientIp: String = "")

interface Visits {
    fun save(visit: Visit): Visit
}

class LoginHandler(private val jdbc: JdbcTemplate, private val visits: Visits, private val connection: Connection) {
    private val log = LoggerFactory.getLogger(LoginHandler::class.java)

    fun onLogin(request: HttpServletRequest) {
        log.info("login from {}", request.remoteAddr)
    }

    fun onFailure(request: HttpServletRequest) {
        log.warn("failed login from ${request.remoteHost}")
    }

    fun onLambda(request: HttpServletRequest) {
        log.info { "visit from ${request.remoteAddr}" }
    }

    fun onForwarded(request: HttpServletRequest) {
        val ip = request.getHeader("X-Forwarded-For")
        log.debug("ip=$ip")
    }

    fun onKtor(call: ApplicationCall) {
        log.info("hit from " + call.request.origin.remoteHost)
    }

    fun onKtorHeader(call: ApplicationCall) {
        val ip = call.request.headers["X-Real-IP"]
        jdbc.update("insert into visits(ip) values (?)", ip)
    }

    fun onContext(request: HttpServletRequest) {
        MDC.put("client", request.remoteAddr)
    }

    fun onVisit(request: HttpServletRequest) {
        val visit = Visit()
        visit.ipAddress = request.remoteAddr
        visits.save(visit)
    }

    fun onNamed(request: HttpServletRequest) {
        visits.save(Visit(clientIp = request.getRemoteAddr()))
    }

    fun onPrepared(request: HttpServletRequest) {
        val ip = request.remoteAddr
        connection.prepareStatement("insert into hits(ip) values (?)").use { ps ->
            ps.setString(1, ip)
            ps.executeUpdate()
        }
    }

    fun onRaw(call: ApplicationCall) {
        val ip = call.request.origin.remoteHost
        jdbc.update("""insert into audit(ip, at) values (?, now())""", ip)
    }

    fun onExpression(request: HttpServletRequest) = visits.save(Visit(ipAddress = request.remoteAddr))
}
