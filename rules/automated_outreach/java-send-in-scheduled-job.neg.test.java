// lexcode-expect: 0
package demo.jobs;

import java.util.List;
import jakarta.mail.internet.MimeMessage;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class Housekeeping {
    private final SessionRepository sessions;
    private final JmsTemplate jmsTemplate;
    private final JavaMailSender mailSender;

    public Housekeeping(SessionRepository sessions, JmsTemplate jmsTemplate, JavaMailSender mailSender) {
        this.sessions = sessions;
        this.jmsTemplate = jmsTemplate;
        this.mailSender = mailSender;
    }

    // A scheduled job that sends nothing.
    @Scheduled(cron = "0 0 3 * * *")
    public void purgeExpiredSessions() {
        sessions.deleteExpired();
    }

    // A queue publish on a timer contacts nobody.
    @Scheduled(fixedRate = 60000)
    public void heartbeat() {
        jmsTemplate.send("heartbeat", session -> session.createTextMessage("alive"));
    }

    // The mail a person asked for, sent from the request that carried the ask; no timer involved.
    public void sendPasswordReset(MimeMessage reset) {
        mailSender.send(reset);
    }

    // A scheduled job may build a report and keep it; sending it is somebody else's call.
    @Scheduled(fixedDelay = 3600000)
    public List<String> buildReport() {
        return sessions.summaries();
    }
}

class CleanupJob implements Job {
    private final TempFiles files;

    CleanupJob(TempFiles files) {
        this.files = files;
    }

    @Override
    public void execute(JobExecutionContext context) {
        files.deleteOlderThanDays(7);
    }
}

// A job that mails an alert to the operator when it fails: the catch block is an error report on
// the job, not a message to people the software is contacting.
class ReindexJob implements Job {
    private final JavaMailSender mailSender;
    private final SearchIndex index;

    ReindexJob(JavaMailSender mailSender, SearchIndex index) {
        this.mailSender = mailSender;
        this.index = index;
    }

    @Override
    public void execute(JobExecutionContext context) {
        try {
            index.rebuildAll();
        } catch (RuntimeException e) {
            mailSender.send(new org.springframework.mail.SimpleMailMessage());
        }
    }
}
