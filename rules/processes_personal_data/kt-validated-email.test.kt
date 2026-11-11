// lexcode-expect: 6
// Request and persistent objects that validate an email address a person supplies: a body property,
// a property with a message and a regexp, a lateinit property, and constructor properties of a data
// class (plain, with a use-site target, and a var with a default).
package demo.web

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

class SignupForm {
    @NotBlank
    @Email
    var email: String = ""

    @Email(message = "enter a valid address")
    var backupContact: String? = null
}

class InviteRequest {
    @Email(regexp = ".+@.+\\..+")
    lateinit var friend: String
}

data class ContactRequest(
    @NotBlank val name: String,
    @Email val replyTo: String,
    @field:Email val billingContact: String,
    @get:Email var assistant: String? = null,
)
