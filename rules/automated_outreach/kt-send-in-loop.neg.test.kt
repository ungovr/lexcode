// lexcode-expect: 0
package demo.outreach

import jakarta.mail.Transport
import jakarta.mail.internet.MimeMessage
import org.springframework.jms.core.JmsTemplate
import org.springframework.mail.javamail.JavaMailSender

class AccountMailer(
    private val mailSender: JavaMailSender,
    private val jmsTemplate: JmsTemplate,
) {
    // A password reset the person just asked for: one message, in a request handler.
    fun sendPasswordReset(reset: MimeMessage) {
        mailSender.send(reset)
    }

    // A retry loop around ONE message to ONE person is not a loop over recipients.
    fun sendWithRetry(message: MimeMessage) {
        for (attempt in 1..3) {
            try {
                Transport.send(message)
                return
            } catch (e: Exception) {
                Thread.sleep(1000L * attempt)
            }
        }
    }

    // The same retry loop with its bound spelled in words, and a loop variable named for the attempt.
    fun sendWithRetryUntil(message: MimeMessage, maxRetries: Int) {
        for (n in 0 until maxRetries) {
            Transport.send(message)
        }
        for (attempt in retrySchedule) mailSender.send(message)
        for (attempt in 0 until limit) mailSender.send(message)
    }

    // A fallback loop over mail relays: ONE message to ONE person, whichever relay accepts it.
    fun deliverViaFirstRelay(relays: List<String>, message: MimeMessage): Boolean {
        for (relay in relays) {
            try {
                mailSender.send(message)
                return true
            } catch (e: Exception) {
                // try the next relay
            }
        }
        relays.forEach { mailSender.send(message) }
        return false
    }

    // A loop that builds the addresses and sends nothing; the one message goes out after it.
    fun sendSummaryToOwner(names: List<String>, summary: MimeMessage) {
        val lines = mutableListOf<String>()
        for (name in names) {
            lines.add("- $name")
        }
        mailSender.send(summary)
    }

    // An internal message bus named "messaging" publishes to topics inside the app; nobody is contacted.
    fun publishAll(topics: List<String>, messaging: InternalMessaging, event: Any) {
        for (topic in topics) {
            messaging.send(topic, event)
        }
        topics.forEach { messaging.send(it, event) }
    }

    // A queue publish inside a loop contacts nobody.
    fun enqueueAll(payloads: List<String>) {
        for (payload in payloads) {
            jmsTemplate.send("work.queue") { session -> session.createTextMessage(payload) }
        }
    }

    // A forEach whose body sends nothing.
    fun tally(payloads: List<String>) {
        payloads.forEach { counter.add(it.length) }
        payloads?.forEach { counter.add(it.length) }
    }

    // Calls that share the shape of a vendor's send but are not the vendor's: this file imports
    // neither Twilio nor Postmark, and the receivers are not a Resend client.
    fun lookalikes(users: List<String>, directory: Directory, audit: AuditLog, client: HttpApi, message: MimeMessage) {
        // A numeric range with an ordinary loop variable: the same message again, not a list of people.
        for (n in 1..3) Transport.send(message)
        for (u in users) {
            client.api(u)
            Message.creator(u, "x").create()
            Call.creator(u, "x").create()
            directory.emails().send(u)
            audit.deliverMessage(u)
        }
    }
}
