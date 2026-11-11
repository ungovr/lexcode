// lexcode-expect: 0
// Sign-in that holds no user accounts, and classes that only look like account code: a single shared
// credential, a JWT resource server, classes with lookalike names, a function named formLogin, and
// a password policy.
package demo.security

import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.invoke

interface UserDetailsLookup {
    fun find(name: String): String?
}

// A supertype whose name only starts with the real one.
class UserDetailsServiceMetrics : UserDetailsLookup {
    override fun find(name: String): String? = null
}

class UserDetailsMapper(private val lookup: UserDetailsLookup) : Runnable {
    override fun run() {
        lookup.find("x")
    }
}

class FormLoginTracker {
    fun formLogin(name: String): String = name
}

class PasswordPolicy {
    fun accepts(password: String): Boolean = password.length >= 12
}

class SecurityConfig {
    // One shared credential over HTTP Basic, and a JWT resource server: no user records.
    fun chain(http: HttpSecurity): HttpSecurity {
        http {
            httpBasic { }
            oauth2ResourceServer {
                jwt { }
            }
        }
        return http.httpBasic { }
    }
}
