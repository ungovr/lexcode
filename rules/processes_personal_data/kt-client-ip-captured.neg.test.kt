// lexcode-expect: 0
// A request address that is compared, counted in memory, or never stored: an allow-list check, an
// in-memory rate limit, a proxy protocol header, the server's own address, a loopback literal, an
// object that nothing saves, a presence check that is logged, and a captcha verdict whose error
// message is logged.
package demo.web

import jakarta.servlet.http.HttpServletRequest
import java.util.concurrent.ConcurrentHashMap
import org.slf4j.LoggerFactory

class Plain(var ipAddress: String = "", val clientIp: String = "")

interface Captcha {
    fun checkAnswer(address: String?): Result
}

class Result(val message: String, val ok: Boolean)

// Calls that take the address and answer about it; each answer is a string, so only the call name
// says it is not the address itself.
class Guard {
    fun verifyOrigin(address: String?): String = "ok"
    fun validateOrigin(address: String?): String = "ok"
    fun isInternal(address: String?): String = "no"
    fun hasQuota(address: String?): String = "yes"
    fun startsWithPrivate(address: String?): String = "no"
}

class GuardHandler(private val captcha: Captcha, private val allowed: Set<String>) {
    private val log = LoggerFactory.getLogger(GuardHandler::class.java)
    private val hits = ConcurrentHashMap<String, Int>()

    // Compared with an allow-list; the address itself is not written anywhere.
    fun isAllowed(request: HttpServletRequest): Boolean {
        val permitted = allowed.contains(request.remoteAddr)
        log.info("allow-list check done: {}", permitted)
        return permitted
    }

    // Counted in memory for rate limiting only.
    fun throttle(request: HttpServletRequest) {
        hits.merge(request.remoteAddr, 1) { a, b -> a + b }
    }

    // A protocol header, not an address.
    fun scheme(request: HttpServletRequest) {
        log.debug("scheme {}", request.getHeader("X-Forwarded-Proto"))
    }

    // The server's own address, and a literal bind address.
    fun bind(request: HttpServletRequest) {
        log.info("listening on {}", request.localAddr)
        log.info("bind {}", "127.0.0.1")
    }

    // An object with an address property that nothing saves.
    fun draft(request: HttpServletRequest): Plain {
        val visit = Plain()
        visit.ipAddress = request.remoteAddr
        return Plain(clientIp = request.remoteAddr)
    }

    // A presence check, logged as a boolean.
    fun present(request: HttpServletRequest) {
        log.info("has address: {}", request.remoteAddr != null)
        log.info("is office: {}", request.remoteAddr == "10.0.0.1")
    }

    // Answers about the address, logged without it.
    fun answers(request: HttpServletRequest, guard: Guard) {
        log.info("verify {}", guard.verifyOrigin(request.remoteAddr))
        log.info("validate {}", guard.validateOrigin(request.remoteAddr))
        log.info("internal {}", guard.isInternal(request.remoteAddr))
        log.info("quota {}", guard.hasQuota(request.remoteAddr))
        log.info("private {}", guard.startsWithPrivate(request.remoteAddr))
    }

    // A captcha verdict: the error message is logged, not the address.
    fun captchaFailed(request: HttpServletRequest) {
        val verdict = captcha.checkAnswer(request.remoteAddr)
        if (!verdict.ok) log.error("captcha failed: {}", verdict.message)
    }
}
