// lexcode-expect: 0
package demo.bulk;

import java.util.List;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.model.SendEmailRequest;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;

public class SingleSends {
    private final AmazonSimpleEmailService ses;
    private final JavaMailSender mailSender;
    private final FirebaseMessaging firebaseMessaging;
    private final ArchiveQueue archiveQueue;
    private final ReportClient reports;

    public SingleSends(AmazonSimpleEmailService ses, JavaMailSender mailSender, FirebaseMessaging firebaseMessaging,
                       ArchiveQueue archiveQueue, ReportClient reports) {
        this.ses = ses;
        this.mailSender = mailSender;
        this.firebaseMessaging = firebaseMessaging;
        this.archiveQueue = archiveQueue;
        this.reports = reports;
    }

    // One message to the one person the request names: a receipt or a reset.
    public void receipt(SendEmailRequest request) {
        ses.sendEmail(request);
    }

    public void reset(MimeMessage message) {
        mailSender.send(message);
    }

    // A call on the push client that sends nothing.
    public String describe(Message message) {
        return firebaseMessaging.toString();
    }

    // sendAll on an internal bus named "messaging" fans out inside the app.
    public void fanOut(InternalMessaging messaging, List<String> events) {
        messaging.sendAll(events);
    }

    // sendAll and sendBulk on things that are not a message service: a queue of archive records,
    // a report upload.
    public void archive(List<String> records) {
        archiveQueue.sendAll(records);
        reports.sendBulkData(records);
    }
}
