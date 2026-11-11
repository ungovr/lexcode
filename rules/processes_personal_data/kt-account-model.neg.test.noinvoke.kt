// lexcode-expect: 0
// A file that imports Spring Security but not the Kotlin configuration DSL's invoke operator, with
// a local function named like a DSL block.
package demo.security

import org.springframework.security.config.annotation.web.builders.HttpSecurity

fun formLogin(block: () -> Unit) {
    block()
}

fun oauth2Login(block: () -> Unit) {
    block()
}

class LocalConfig {
    fun describe(http: HttpSecurity): String {
        formLogin { println("local") }
        oauth2Login { println("local") }
        return http.toString()
    }
}
