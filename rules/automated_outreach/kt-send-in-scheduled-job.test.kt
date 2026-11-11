// lexcode-expect: 9
package demo.jobs

import com.amazonaws.services.simpleemail.AmazonSimpleEmailService
import com.google.firebase.messaging.FirebaseMessaging
import com.twilio.rest.api.v2010.account.Message
import com.twilio.type.PhoneNumber
import jakarta.mail.Transport
import jakarta.mail.internet.MimeMessage
import java.util.Timer
import java.util.TimerTask
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit
import kotlin.concurrent.fixedRateTimer
import org.quartz.Job
import org.quartz.JobExecutionContext
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

// Mail, texts and pushes the program sends on its own schedule, with no user action behind them.
@Component
class ScheduledOutreach(
    private val mailSender: JavaMailSender,
    private val ses: AmazonSimpleEmailService,
    private val sesClient: aws.sdk.kotlin.services.sesv2.SesV2Client,
    private val firebaseMessaging: FirebaseMessaging,
) {
    @Scheduled(cron = "0 0 8 * * MON")
    fun weeklyDigest() {
        val digest = mailSender.createMimeMessage()
        mailSender.send(digest)
    }

    @Scheduled(fixedRate = 86400000)
    fun dailyTextReminder() {
        Message.creator(PhoneNumber("+15550111"), PhoneNumber("+15550100"), "Your appointment is tomorrow.").create()
    }

    @Scheduled(cron = "0 0 9 * * *")
    suspend fun morningDsl() {
        sesClient.sendEmail {
            fromEmailAddress = "news@example.org"
        }
    }

    // The send is inside a try block; only a send inside the catch block is an operator alert.
    @Scheduled(cron = "0 0 10 * * *")
    fun guardedDigest(subscriber: String) {
        try {
            mailSender.send(mailFor(subscriber))
        } catch (e: Exception) {
            log.warn("digest failed", e)
        }
    }

    fun startNightlyBlast(scheduler: ScheduledExecutorService, push: com.google.firebase.messaging.Message) {
        scheduler.scheduleAtFixedRate({
            try {
                firebaseMessaging.send(push)
            } catch (e: Exception) {
                // next tick
            }
        }, 0, 1, TimeUnit.DAYS)
    }

    fun startTimer(timer: Timer) {
        timer.schedule(object : TimerTask() {
            override fun run() {
                ses.sendEmail(null)
            }
        }, 0L, 3600000L)
    }

    fun startKotlinTimer(m: MimeMessage) {
        fixedRateTimer("digest", false, 0L, 60_000L) {
            mailSender.send(m)
        }
    }
}

class NewsletterJob : Job {
    override fun execute(context: JobExecutionContext) {
        val issue = MimeMessage(null as jakarta.mail.Session?)
        Transport.send(issue)
    }
}

class DigestTimerTask : TimerTask() {
    override fun run() {
        sendDigests()
    }

    private fun sendDigests() {
    }
}
