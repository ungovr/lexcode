// lexcode-expect: 0
package demo.jobs

import jakarta.mail.Transport
import jakarta.mail.internet.MimeMessage
import java.util.TimerTask
import org.quartz.Job
import org.quartz.JobExecutionContext
import org.springframework.jms.core.JmsTemplate
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class Housekeeping(
    private val sessions: SessionRepository,
    private val jmsTemplate: JmsTemplate,
    private val mailSender: JavaMailSender,
) {
    // A scheduled job that sends nothing.
    @Scheduled(cron = "0 0 3 * * *")
    fun purgeExpiredSessions() {
        sessions.deleteExpired()
    }

    // A queue publish on a timer contacts nobody.
    @Scheduled(fixedRate = 60000)
    fun heartbeat() {
        jmsTemplate.send("heartbeat") { session -> session.createTextMessage("alive") }
    }

    // The mail a person asked for, sent from the request that carried the ask; no timer involved.
    fun sendPasswordReset(reset: MimeMessage) {
        mailSender.send(reset)
    }

    // A scheduled job may build a report and keep it; sending it is somebody else's call.
    @Scheduled(fixedDelay = 3600000)
    fun buildReport(): List<String> = sessions.summaries()
}

class CleanupJob(private val files: TempFiles) : Job {
    override fun execute(context: JobExecutionContext) {
        files.deleteOlderThanDays(7)
    }
}

// A job that mails an alert to the operator when it fails: the catch block is an error report on
// the job, not a message to people the software is contacting.
class ReindexJob(
    private val mailSender: JavaMailSender,
    private val index: SearchIndex,
) : Job {
    override fun execute(context: JobExecutionContext) {
        try {
            index.rebuildAll()
        } catch (e: RuntimeException) {
            mailSender.send(org.springframework.mail.SimpleMailMessage())
        }
    }
}

// The same alert, with a typed catch and other statements around the send, from a timer task.
class NightlyImport(
    private val importer: Importer,
    private val mailer: Mailer,
    private val sendgrid: SendGridClient,
    private val resend: ResendClient,
) : TimerTask() {
    override fun run() {
        try {
            importer.pull()
        } catch (e: java.io.IOException) {
            log.error("import failed", e)
            mailer.sendAlert("import failed: ${e.message}")
            sendFailureAlert(e)
            Transport.send(failureMessage(e))
            sendgrid.api(failureRequest(e))
            resend.emails().send(failureOptions(e))
        }
    }
}

// A timer that only measures.
fun startMeter(meter: Meter) {
    kotlin.concurrent.fixedRateTimer("meter", false, 0L, 1000L) {
        meter.tick()
    }
}

// Calls that share the shape of a vendor's send but are not the vendor's: this file imports neither
// Twilio nor Postmark, and the receivers are not a Resend client.
@Component
class OwnClasses(private val directory: Directory, private val audit: AuditLog, private val client: HttpApi) {
    @Scheduled(fixedRate = 1000)
    fun tick() {
        Message.creator("a", "b").create()
        Call.creator("a", "b").create()
        client.api("a")
        directory.emails().send("a")
        audit.deliverMessage("a")
    }
}
