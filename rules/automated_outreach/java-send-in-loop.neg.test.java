// lexcode-expect: 0
package demo.outreach;

import java.util.ArrayList;
import java.util.List;
import jakarta.mail.Transport;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.jms.core.JmsTemplate;

public class AccountMailer {
    private final JavaMailSender mailSender;
    private final JmsTemplate jmsTemplate;

    public AccountMailer(JavaMailSender mailSender, JmsTemplate jmsTemplate) {
        this.mailSender = mailSender;
        this.jmsTemplate = jmsTemplate;
    }

    // A password reset the person just asked for: one message, in a request handler.
    public void sendPasswordReset(MimeMessage reset) {
        mailSender.send(reset);
    }

    // A retry loop around ONE message to ONE person is not a loop over recipients.
    public void sendWithRetry(MimeMessage message) throws Exception {
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                Transport.send(message);
                return;
            } catch (Exception e) {
                Thread.sleep(1000L * (attempt + 1));
            }
        }
    }

    // A fallback loop over mail relays: ONE message to ONE person, whichever relay accepts it.
    public boolean deliverViaFirstRelay(List<String> relays, MimeMessage message) {
        for (String relay : relays) {
            try {
                mailSender.send(message);
                return true;
            } catch (Exception e) {
                // try the next relay
            }
        }
        return false;
    }

    // A loop that builds the addresses and sends nothing; the one message goes out after it.
    public void sendSummaryToOwner(List<String> names, MimeMessage summary) {
        List<String> lines = new ArrayList<>();
        for (String name : names) {
            lines.add("- " + name);
        }
        mailSender.send(summary);
    }

    // An internal message bus named "messaging" publishes to topics inside the app; nobody is contacted.
    public void publishAll(List<String> topics, Object bus, InternalMessaging messaging, Object event) {
        for (String topic : topics) {
            messaging.send(topic, event);
        }
    }

    // A queue publish inside a loop contacts nobody.
    public void enqueueAll(List<String> payloads) {
        for (String payload : payloads) {
            jmsTemplate.send("work.queue", session -> session.createTextMessage(payload));
        }
    }
}
