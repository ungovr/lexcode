// lexcode-expect: 6
package demo.workers;

import androidx.work.Worker;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.mail.internet.MimeMessage;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

// Messages sent from a queue worker, an async method or a background task, where the code does not
// show whether a person asked for each one.
@Service
public class NotificationWorkers {
    private final JavaMailSender mailSender;
    private final ReminderService reminders;

    public NotificationWorkers(JavaMailSender mailSender, ReminderService reminders) {
        this.mailSender = mailSender;
        this.reminders = reminders;
    }

    @Async
    public void sendWelcome(MimeMessage welcome) {
        mailSender.send(welcome);
    }

    @KafkaListener(topics = "sms-outbox")
    public void onSmsOutbox(String phone) {
        Message.creator(new PhoneNumber(phone), new PhoneNumber("+15550100"), "Your order shipped.").create();
    }

    @RabbitListener(queues = "reminders")
    public void onReminderDue(long accountId) {
        reminders.sendReminders(accountId);
    }

    @JmsListener(destination = "push-outbox")
    public void onPushOutbox(String token) {
        reminders.sendPushNotification(token);
    }

    @Scheduled(cron = "0 0 7 * * *")
    public void morning() {
        reminders.sendNewsletter();
    }
}

class PushWorker extends Worker {
    private final ReminderService reminders = new ReminderService();

    PushWorker(android.content.Context context, androidx.work.WorkerParameters params) {
        super(context, params);
    }

    @Override
    public Result doWork() {
        reminders.sendPush("token");
        return Result.success();
    }
}
