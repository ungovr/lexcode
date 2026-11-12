// lexcode-expect: 8
// User accounts and sign-in with Spring Security written in Kotlin: classes that implement
// UserDetails or UserDetailsService (alone, among other supertypes, as an object or by delegation),
// a stored-user manager, and form login and OAuth2 login in the configuration DSL and on the builder.
package demo.security

import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.provisioning.JdbcUserDetailsManager
import javax.sql.DataSource

class Account(private val name: String, private val secret: String) : UserDetails {
    override fun getUsername(): String = name
}

class StoredAccount(private val name: String) : Base(), UserDetails, java.io.Serializable {
    override fun getUsername(): String = name
}

class AccountLookup(private val repo: Repo) : UserDetailsService {
    override fun loadUserByUsername(name: String): UserDetails = repo.find(name)
}

object InMemoryLookup : UserDetailsService {
    override fun loadUserByUsername(name: String): UserDetails = TODO()
}

class DelegatingLookup(private val inner: Lookup) : UserDetailsService by inner

class SecurityConfig {
    fun users(dataSource: DataSource) = JdbcUserDetailsManager(dataSource)

    fun dsl(http: HttpSecurity) {
        http {
            formLogin {
                loginPage = "/login"
            }
        }
    }

    fun builder(http: HttpSecurity) {
        http.oauth2Login { }
    }
}
