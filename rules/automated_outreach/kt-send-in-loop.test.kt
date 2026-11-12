// lexcode-expect: 13
package demo.outreach

import com.amazonaws.services.simpleemail.AmazonSimpleEmailService
import com.google.firebase.messaging.FirebaseMessaging
import com.sendgrid.SendGrid
import com.twilio.rest.api.v2010.account.Message
import com.postmarkapp.postmark.client.ApiClient
import com.twilio.type.PhoneNumber
import jakarta.mail.Transport
import jakarta.mail.internet.MimeMessage
import org.springframework.mail.javamail.JavaMailSender

// Mail and texts the program sends on its own: once per recipient in a loop.
class DigestSender(
    private val mailSender: JavaMailSender,
    private val ses: AmazonSimpleEmailService,
    private val sesClient: aws.sdk.kotlin.services.sesv2.SesV2Client,
    private val sendgrid: SendGrid,
    private val firebaseMessaging: FirebaseMessaging,
) {
    fun weeklyDigest(subscribers: List<Subscriber>) {
        for (s in subscribers) {
            val message = mailSender.createMimeMessage()
            mailSender.send(message)
        }
    }

    fun announce(subscribers: List<Subscriber>, template: MimeMessage) {
        for (i in subscribers.indices) Transport.send(template)
    }

    fun viaSes(subscribers: List<Subscriber>) {
        subscribers.forEach { s -> ses.sendEmail(requestFor(s)) }
    }

    fun viaSendGrid(subscribers: List<Subscriber>) {
        for (s in subscribers) {
            sendgrid.api(requestFor(s))
        }
    }

    fun textEveryone(phones: List<String>) {
        for (phone in phones) {
            Message.creator(PhoneNumber(phone), PhoneNumber("+15550100"), "Trash pickup moves to Tuesday.").create()
        }
    }

    fun pushToAll(messages: List<com.google.firebase.messaging.Message>) {
        for (m in messages) {
            FirebaseMessaging.getInstance().send(m)
        }
        messages.forEach { firebaseMessaging.send(it) }
    }

    fun remindEveryone(subscribers: List<Subscriber>) {
        for (s in subscribers) {
            sendReminderEmail(s)
        }
    }

    private fun sendReminderEmail(s: Subscriber) {
    }

    fun notifyAll(subscribers: List<Subscriber>, notifier: Notifier) {
        for (s in subscribers) {
            notifier.sendEmail(s.address, "Your bill is ready")
        }
    }

    // The collection may be nullable, and the loop may be a map with the Kotlin SES DSL inside.
    fun nullable(subscribers: List<Subscriber>?) {
        subscribers?.forEach { s -> mailSender.send(mailFor(s)) }
    }

    fun viaResendAndPostmark(subscribers: List<Subscriber>, resend: com.resend.Resend, postmark: ApiClient) {
        for (s in subscribers) {
            resend.emails().send(optionsFor(s))
            postmark.deliverMessage(messageFor(s))
        }
    }

    suspend fun dsl(subscribers: List<Subscriber>) {
        subscribers.map { s ->
            sesClient.sendEmail {
                fromEmailAddress = "news@example.org"
                destination { toAddresses = listOf(s.address) }
            }
        }
    }
}
