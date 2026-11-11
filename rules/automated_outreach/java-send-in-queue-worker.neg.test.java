// lexcode-expect: 0
package demo.workers;

import androidx.work.Worker;
import jakarta.mail.internet.MimeMessage;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@Service
public class BackgroundWork {
    private final SearchIndex index;
    private final JmsTemplate jmsTemplate;
    private final AuditLog audit;

    public BackgroundWork(SearchIndex index, JmsTemplate jmsTemplate, AuditLog audit) {
        this.index = index;
        this.jmsTemplate = jmsTemplate;
        this.audit = audit;
    }

    // Queue workers and async methods that send nothing.
    @Async
    public void reindex(long articleId) {
        index.rebuild(articleId);
    }

    @KafkaListener(topics = "audit-events")
    public void onAuditEvent(String payload) {
        audit.append(payload);
    }

    // A queue publish contacts nobody.
    @RabbitListener(queues = "forward")
    public void forward(String body) {
        jmsTemplate.send("downstream", session -> session.createTextMessage(body));
    }
}

// The mail a person asked for, sent from the request that carried the ask; no queue or async hop.
@RestController
class ResetController {
    private final JavaMailSender mailSender;

    ResetController(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostMapping("/password-reset")
    public void reset(MimeMessage message) {
        mailSender.send(message);
    }
}

// A background worker that syncs and sends no message.
class SyncWorker extends Worker {
    SyncWorker(android.content.Context context, androidx.work.WorkerParameters params) {
        super(context, params);
    }

    @Override
    public Result doWork() {
        Sync.pullLatest();
        return Result.success();
    }
}
