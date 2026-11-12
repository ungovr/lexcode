// lexcode-expect: 0
// Not an open sign-up page: register and sign-up paths that need a role or a login, open
// paths that are not sign-up, and an authorize call that is not Spring Security's.
package demo.security

import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.invoke

class SecurityConfig {
    fun filter(http: HttpSecurity) {
        http {
            authorizeHttpRequests {
                authorize("/register", hasRole("ADMIN"))
                authorize("/signup", authenticated)
                authorize("/login", permitAll)
                authorize("/css/**", permitAll)
                authorize("/health", permitAll)
            }
        }
    }

    fun chain(http: HttpSecurity) {
        http.authorizeHttpRequests { auth ->
            auth.requestMatchers("/register").hasRole("ADMIN")
                .requestMatchers("/signup").authenticated()
                .requestMatchers("/login", "/css/**").permitAll()
        }
    }
}

class Permissions {
    val permitAll = Any()

    fun grant() {
        authorize("/register", permitAll)
    }

    fun authorize(path: String, rule: Any) {}
}
