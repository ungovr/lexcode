// lexcode-expect: 0
package demo.bulk

import com.amazonaws.services.simpleemail.AmazonSimpleEmailService
import com.amazonaws.services.simpleemail.model.SendEmailRequest
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.Message
import jakarta.mail.internet.MimeMessage
import org.springframework.mail.javamail.JavaMailSender

class SingleSends(
    private val ses: AmazonSimpleEmailService,
    private val mailSender: JavaMailSender,
    private val firebaseMessaging: FirebaseMessaging,
    private val archiveQueue: ArchiveQueue,
    private val reports: ReportClient,
) {
    // One message to the one person the request names: a receipt or a reset.
    fun receipt(request: SendEmailRequest) {
        ses.sendEmail(request)
    }

    fun reset(message: MimeMessage) {
        mailSender.send(message)
    }

    // A call on the push client that sends nothing.
    fun describe(message: Message): String = firebaseMessaging.toString()

    // sendAll on an internal bus named "messaging" fans out inside the app.
    fun fanOut(messaging: InternalMessaging, events: List<String>) {
        messaging.sendAll(events)
    }

    // sendAll and sendBulk on things that are not a message service: a queue of archive records,
    // a report upload.
    fun archive(records: List<String>) {
        archiveQueue.sendAll(records)
        reports.sendBulkData(records)
    }

    // Bulk-looking calls on receivers that are not message services.
    fun notAMailer(batcher: Batcher, metrics: Metrics, firebaseMessagingPeer: Quota) {
        batcher.sendMessages(1)
        metrics.sendEach("count")
        metrics.batch().send(1)
        Notification.creator("sid")
        firebaseMessagingPeer.sendAllocation(1)
    }
}
