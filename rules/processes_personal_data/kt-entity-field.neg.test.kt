// lexcode-expect: 0
// Personal-looking names that are not stored: a request object, a constant, transient and ignored
// fields (constructor and body), a local variable and a function parameter in an entity, and an
// entity whose columns hold nothing about a person.
package demo.shop

import androidx.room.Ignore
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Transient

// Not an entity: a plain command object that is never persisted.
class EmailTemplateRequest(val email: String, var phone: String)

data class SignUpForm(val email: String, val dateOfBirth: String)

// Not an entity either: the same names as body properties.
class ProfileDraft {
    var email: String = ""
    var phone: String? = null
}

@Entity
class Product(
    @Id val id: Long,
    @Column(name = "title") val title: String,
    @Column(name = "email_template") val emailTemplate: String,
    @Transient val email: String,
    @field:Transient var phone: String,
    @Ignore val mobile: String,
    @Ignore var dob: String,
    @Transient var passport: String,
    @get:Transient val ssn: String,
) {
    // The word appears in a constant, in transient body fields and in a local variable.
    companion object {
        const val EMAIL: String = "email"
    }

    @Transient
    var passport: String? = null

    @Ignore
    var ipAddress: String = ""

    var emailSubject: String = ""

    fun describe(phone: String): String {
        val email: String = "n/a"
        var dob: String = "n/a"
        return title + email + phone + dob
    }
}

// Each form of a skipped body property: without and with an initializer, val and var, @Transient and @Ignore.
@Entity
abstract class Skipped {
    @Transient
    abstract val email: String

    @Transient
    abstract var phone: String

    @Transient
    val dateOfBirth: String = ""

    @Transient
    var ssn: String = ""

    @Ignore
    abstract val taxId: String

    @Ignore
    abstract var ipAddress: String

    @Ignore
    val clientIp: String = ""

    @Ignore
    var remoteAddr: String = ""
}
