// lexcode-expect: 0
// Request objects that validate other things, and email text that is not an address field: other
// constraint annotations, annotations whose names only start with Email, and a function that is
// merely named email.
package demo.web

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

annotation class EmailTemplate
annotation class EmailedOnce(val days: Int = 1)

class ContactTopicForm {
    @NotBlank
    var subject: String = ""

    @Size(max = 2000)
    var message: String = ""

    // Named like an address, validated as free text only.
    @NotBlank
    var emailSubject: String = ""

    @EmailTemplate
    var layout: String = ""

    @EmailedOnce(days = 3)
    var reminder: String = ""
}

data class NewsletterTemplate(
    @field:NotBlank val emailBody: String,
    @field:Size(max = 80) val title: String,
    @EmailTemplate val footer: String,
)

class Mailer {
    // A function named email and a parameter, with no validation annotation at all.
    fun email(address: String): String = "To: $address"
}
