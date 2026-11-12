// lexcode-expect: 9
package demo.outreach;

import java.util.List;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.google.firebase.messaging.FirebaseMessaging;
import com.sendgrid.SendGrid;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.mail.Transport;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;

// Mail and texts the program sends on its own: once per recipient in a loop.
public class DigestSender {
    private final JavaMailSender mailSender;
    private final AmazonSimpleEmailService ses;
    private final SendGrid sendgrid;
    private final FirebaseMessaging firebaseMessaging;

    public DigestSender(JavaMailSender mailSender, AmazonSimpleEmailService ses, SendGrid sendgrid,
                        FirebaseMessaging firebaseMessaging) {
        this.mailSender = mailSender;
        this.ses = ses;
        this.sendgrid = sendgrid;
        this.firebaseMessaging = firebaseMessaging;
    }

    public void weeklyDigest(List<Subscriber> subscribers) {
        for (Subscriber s : subscribers) {
            MimeMessage message = mailSender.createMimeMessage();
            mailSender.send(message);
        }
    }

    public void announce(List<Subscriber> subscribers, MimeMessage template) throws Exception {
        for (int i = 0; i < subscribers.size(); i++) {
            Transport.send(template);
        }
    }

    public void viaSes(List<Subscriber> subscribers) {
        subscribers.forEach(s -> ses.sendEmail(requestFor(s)));
    }

    public void viaSendGrid(List<Subscriber> subscribers) throws Exception {
        for (Subscriber s : subscribers) {
            sendgrid.api(requestFor(s));
        }
    }

    public void textEveryone(List<String> phones) {
        for (String phone : phones) {
            Message.creator(new PhoneNumber(phone), new PhoneNumber("+15550100"), "Trash pickup moves to Tuesday.").create();
        }
    }

    public void pushToAll(List<com.google.firebase.messaging.Message> messages) throws Exception {
        for (com.google.firebase.messaging.Message m : messages) {
            FirebaseMessaging.getInstance().send(m);
        }
        messages.stream().forEach(m -> firebaseMessaging.send(m));
    }

    public void remindEveryone(List<Subscriber> subscribers) {
        for (Subscriber s : subscribers) {
            sendReminderEmail(s);
        }
    }

    private void sendReminderEmail(Subscriber s) {
    }

    public void notifyAll(List<Subscriber> subscribers, Notifier notifier) {
        for (Subscriber s : subscribers) {
            notifier.sendEmail(s.address(), "Your bill is ready");
        }
    }
}
