// lexcode-expect: 5
// Sign-up opened to everyone in the Spring Security configuration: the Kotlin DSL, and the
// request matcher chain with permitAll.
package demo.security

import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.web.util.matcher.AntPathRequestMatcher

class SecurityConfig {
    fun filter(http: HttpSecurity) {
        http {
            authorizeHttpRequests {
                authorize("/signup", permitAll)
                authorize(HttpMethod.POST, "/register", permitAll)
                authorize("/login", permitAll)
                authorize("/admin/**", hasRole("ADMIN"))
            }
        }
    }

    fun chain(http: HttpSecurity) {
        http.authorizeHttpRequests { auth ->
            auth.requestMatchers("/login", "/signup").permitAll()
        }
        http.authorizeRequests().antMatchers("/api/v1/users/register").permitAll()
        http.authorizeHttpRequests { it.requestMatchers(AntPathRequestMatcher("/registration")).permitAll() }
    }
}
