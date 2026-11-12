// lexcode-expect: 0
package demo.workers

import androidx.work.CoroutineWorker
import androidx.work.Worker
import jakarta.mail.internet.MimeMessage
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.jms.core.JmsTemplate
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RestController

@Service
class BackgroundWork(
    private val index: SearchIndex,
    private val jmsTemplate: JmsTemplate,
    private val audit: AuditLog,
    private val mailSender: JavaMailSender,
) {
    // Queue workers and async methods that send nothing.
    @Async
    fun reindex(articleId: Long) {
        index.rebuild(articleId)
    }

    @KafkaListener(topics = ["audit-events"])
    fun onAuditEvent(payload: String) {
        audit.append(payload)
    }

    // A queue publish contacts nobody.
    @RabbitListener(queues = ["forward"])
    fun forward(body: String) {
        jmsTemplate.send("downstream") { session -> session.createTextMessage(body) }
    }

    // A transactional method is not a queue worker, a timer or an async hop; it is called from a request.
    @Transactional
    fun sendWelcome(welcome: MimeMessage) {
        mailSender.send(welcome)
    }
}

// Transactional methods in every shape a function can take: none is a queue worker.
@Service
class Transactions(private val mailSender: JavaMailSender) {
    @Transactional
    fun a(m: MimeMessage) {
        mailSender.send(m)
    }

    @Transactional
    fun b(m: MimeMessage): Unit {
        mailSender.send(m)
    }

    @Transactional
    fun c(m: MimeMessage) = mailSender.send(m)

    @Transactional
    fun d(m: MimeMessage): Unit = mailSender.send(m)

    @Transactional
    suspend fun e(m: MimeMessage) {
        mailSender.send(m)
    }

    @Transactional
    suspend fun f(m: MimeMessage): Unit {
        mailSender.send(m)
    }

    @Transactional
    suspend fun g(m: MimeMessage) = mailSender.send(m)

    @Transactional
    suspend fun h(m: MimeMessage): Unit = mailSender.send(m)
}

// The mail a person asked for, sent from the request that carried the ask; no queue or async hop.
@RestController
class ResetController(private val mailSender: JavaMailSender) {
    @PostMapping("/password-reset")
    fun reset(message: MimeMessage) {
        mailSender.send(message)
    }
}

// Background workers that sync and send no message.
class SyncWorker(context: android.content.Context, params: androidx.work.WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        Sync.pullLatest()
        return Result.success()
    }
}

class UploadWorker(context: android.content.Context, params: androidx.work.WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        uploads.flush()
        return Result.success()
    }
}

// Calls that share the shape of a vendor's send but are not the vendor's: this file imports neither
// Twilio nor Postmark, and the receivers are not a Resend client.
@Service
class OwnClasses(private val directory: Directory, private val audit: AuditLog, private val client: HttpApi) {
    @Async
    fun tick() {
        Message.creator("a", "b").create()
        Call.creator("a", "b").create()
        client.api("a")
        directory.emails().send("a")
        audit.deliverMessage("a")
    }
}
