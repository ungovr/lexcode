// lexcode-expect: 9
package demo.workers

import androidx.work.CoroutineWorker
import androidx.work.Worker
import com.google.firebase.messaging.FirebaseMessaging
import com.twilio.rest.api.v2010.account.Message
import com.twilio.type.PhoneNumber
import io.awspring.cloud.sqs.annotation.SqsListener
import jakarta.mail.internet.MimeMessage
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.jms.annotation.JmsListener
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.scheduling.annotation.Async
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

// Messages sent from a queue worker, an async method or a background task, where the code does not
// show whether a person asked for each one.
@Service
class NotificationWorkers(
    private val mailSender: JavaMailSender,
    private val reminders: ReminderService,
) {
    @Async
    fun sendWelcome(welcome: MimeMessage) {
        mailSender.send(welcome)
    }

    @KafkaListener(topics = ["sms-outbox"])
    fun onSmsOutbox(phone: String) {
        Message.creator(PhoneNumber(phone), PhoneNumber("+15550100"), "Your order shipped.").create()
    }

    @RabbitListener(queues = ["reminders"])
    fun onReminderDue(accountId: Long) {
        reminders.sendReminders(accountId)
    }

    @JmsListener(destination = "push-outbox")
    fun onPushOutbox(token: String) {
        reminders.sendPushNotification(token)
    }

    @Scheduled(cron = "0 0 7 * * *")
    fun morning() {
        reminders.sendNewsletter()
    }

    @Async
    fun fire(message: MimeMessage) = mailSender.send(message)

    @SqsListener("push-queue")
    suspend fun onPushQueue(push: com.google.firebase.messaging.Message) {
        FirebaseMessaging.getInstance().send(push)
    }
}

class PushWorker(context: android.content.Context, params: androidx.work.WorkerParameters) : Worker(context, params) {
    private val reminders = ReminderService()

    override fun doWork(): Result {
        reminders.sendPush("token")
        return Result.success()
    }
}

class DigestWorker(context: android.content.Context, params: androidx.work.WorkerParameters) : CoroutineWorker(context, params) {
    private val reminders = ReminderService()

    override suspend fun doWork(): Result {
        reminders.notifyDigest()
        return Result.success()
    }
}
