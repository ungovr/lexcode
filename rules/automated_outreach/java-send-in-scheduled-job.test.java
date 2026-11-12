// lexcode-expect: 6
package demo.jobs;

import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.google.firebase.messaging.FirebaseMessaging;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.mail.Transport;
import jakarta.mail.internet.MimeMessage;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// Mail, texts and pushes the program sends on its own schedule, with no user action behind them.
@Component
public class ScheduledOutreach {
    private final JavaMailSender mailSender;
    private final AmazonSimpleEmailService ses;
    private final FirebaseMessaging firebaseMessaging;

    public ScheduledOutreach(JavaMailSender mailSender, AmazonSimpleEmailService ses, FirebaseMessaging firebaseMessaging) {
        this.mailSender = mailSender;
        this.ses = ses;
        this.firebaseMessaging = firebaseMessaging;
    }

    @Scheduled(cron = "0 0 8 * * MON")
    public void weeklyDigest() {
        MimeMessage digest = mailSender.createMimeMessage();
        mailSender.send(digest);
    }

    @Scheduled(fixedRate = 86400000)
    public void dailyTextReminder() {
        Message.creator(new PhoneNumber("+15550111"), new PhoneNumber("+15550100"), "Your appointment is tomorrow.").create();
    }

    public void startNightlyBlast(ScheduledExecutorService scheduler, com.google.firebase.messaging.Message push) {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                firebaseMessaging.send(push);
            } catch (Exception e) {
                // next tick
            }
        }, 0, 1, TimeUnit.DAYS);
    }

    public void startTimer(Timer timer) {
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                ses.sendEmail(null);
            }
        }, 0L, 3600000L);
    }
}

class NewsletterJob implements Job {
    @Override
    public void execute(JobExecutionContext context) throws Exception {
        MimeMessage issue = new MimeMessage((jakarta.mail.Session) null);
        Transport.send(issue);
    }
}

class DigestTimerTask extends TimerTask {
    @Override
    public void run() {
        sendDigests();
    }

    private void sendDigests() {
    }
}
